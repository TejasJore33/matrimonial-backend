import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';
import { Prisma, ProfileStatus } from '@prisma/client';
import { UploadService } from '../upload/upload.service';
import { PAID_SUBSCRIPTION_PLANS } from '../common/constants/subscription.constants';

@Injectable()
export class ProfilesService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async createProfile(userId: string, dto: CreateProfileDto) {
    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new BadRequestException('Profile already exists');
    }

    const slug = this.generateSlug(dto.firstName, dto.lastName);

    // Convert dateOfBirth string to Date object if provided
    // Also trim string fields to remove whitespace
    const profileData: any = {
      userId,
      ...dto,
      slug,
      status: ProfileStatus.DRAFT, // Use enum value
    };

    // Trim string fields
    Object.keys(profileData).forEach(key => {
      if (typeof profileData[key] === 'string') {
        profileData[key] = profileData[key].trim();
      }
    });

    // Convert dateOfBirth string to Date object if provided
    if (profileData.dateOfBirth && typeof profileData.dateOfBirth === 'string') {
      const date = new Date(profileData.dateOfBirth);
      if (isNaN(date.getTime())) {
        throw new BadRequestException('Invalid dateOfBirth format. Expected ISO-8601 date string.');
      }
      profileData.dateOfBirth = date;
    }

    // Clean up the data: remove undefined and empty strings for enum fields
    Object.keys(profileData).forEach(key => {
      if (profileData[key] === undefined) {
        delete profileData[key];
      }
      // Remove empty strings for enum fields (gender, maritalStatus, etc.)
      if (profileData[key] === '' && ['gender', 'maritalStatus', 'familyType', 'diet'].includes(key)) {
        delete profileData[key];
      }
    });

    try {
      // Log the data being sent to Prisma for debugging
      console.log('Creating profile with data:', JSON.stringify(profileData, null, 2));
      
      const profile = await this.prisma.profile.create({
        data: profileData as Prisma.ProfileUncheckedCreateInput,
      });

      const createdProfile = await this.prisma.profile.findUnique({
        where: { id: profile.id },
        include: {
          photos: true,
          user: {
            select: {
              id: true,
              email: true,
              mobile: true,
            },
          },
        },
      });

      // Calculate and update completeness score
      const completenessScore = this.calculateCompleteness(createdProfile);
      await this.prisma.profile.update({
        where: { id: profile.id },
        data: { completenessScore } as any,
      });

      // Award achievement if profile is complete
      if (completenessScore >= 100) {
        try {
          const { GamificationService } = await import('../gamification/gamification.service');
          const gamificationService = new GamificationService(this.prisma);
          await gamificationService.checkAndAwardAchievements(userId, 'PROFILE_COMPLETE');
        } catch (error) {
          // Silently fail if gamification service not available
        }
      }

      return { ...createdProfile, completenessScore };
    } catch (error: any) {
      // Log the full error for debugging
      console.error('Prisma error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error meta:', error.meta);
      
      // Handle unique constraint violations (e.g., duplicate slug)
      if (error.code === 'P2002') {
        // Regenerate slug if it's a duplicate
        const newSlug = this.generateSlug(dto.firstName, dto.lastName);
        profileData.slug = newSlug;
        try {
          const profile = await this.prisma.profile.create({
            data: profileData as Prisma.ProfileUncheckedCreateInput,
          });
          return this.prisma.profile.findUnique({
            where: { id: profile.id },
            include: {
              photos: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  mobile: true,
                },
              },
            },
          });
        } catch (retryError: any) {
          console.error('Retry error:', retryError);
          throw new BadRequestException(`Failed to create profile: ${retryError.message}`);
        }
      }
      
      // Handle validation errors
      if (error.code === 'P2003' || error.code === 'P2011') {
        throw new BadRequestException(`Invalid data: ${error.message}`);
      }
      
      // Re-throw with better error message
      throw new BadRequestException(`Failed to create profile: ${error.message || 'Unknown error'}`);
    }
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const updateData: any = { ...dto };
    if (dto.firstName || dto.lastName) {
      updateData.slug = this.generateSlug(
        dto.firstName || profile.firstName,
        dto.lastName || profile.lastName,
      );
    }

    // Convert dateOfBirth string to Date object if provided
    if (updateData.dateOfBirth && typeof updateData.dateOfBirth === 'string') {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    const updatedProfile = await this.prisma.profile.update({
      where: { userId },
      data: updateData,
      include: {
        photos: true,
      },
    });

    // Calculate and update completeness score
    const completenessScore = this.calculateCompleteness(updatedProfile);
    await this.prisma.profile.update({
      where: { userId },
      data: { completenessScore } as any,
    });

    return { ...updatedProfile, completenessScore };
  }

  async getProfile(userId: string, viewerId?: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        photos: {
          orderBy: { order: 'asc' },
        },
        user: {
          select: {
            id: true,
            email: true,
            mobile: true,
            isEmailVerified: true,
            isMobileVerified: true,
            preferredLanguage: true,
          },
        },
      },
    });

    // If viewing own profile and it doesn't exist, return null instead of throwing error
    // This allows the frontend to show "create profile" message
    if (!profile) {
      if (viewerId === userId) {
        return null;
      }
      throw new NotFoundException('Profile not found');
    }

    // Track profile view
    if (viewerId && viewerId !== userId) {
      await this.trackProfileView(profile.id, viewerId);
    }

    // Apply privacy settings (includes contact view checks)
    return this.applyPrivacySettings(profile, viewerId === userId, viewerId);
  }

  async getProfileBySlug(slug: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { slug },
      include: {
        photos: {
          where: { isApproved: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!profile || profile.status !== 'ACTIVE') {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async uploadPhoto(userId: string, file: Express.Multer.File, isPrimary: boolean = false) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { photos: true },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Check if user has paid subscription (unlimited photos) or free (max 10)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: {
            status: 'ACTIVE',
            endDate: { gt: new Date() },
            plan: { in:[...PAID_SUBSCRIPTION_PLANS]  },
          },
        },
      },
    });

    const hasPaidPlan = user?.subscriptions.length > 0;
    const maxPhotos = hasPaidPlan ? 50 : 10; // Paid plans: 50, Free: 10

    if (profile.photos.length >= maxPhotos) {
      throw new BadRequestException(
        hasPaidPlan
          ? 'Maximum 50 photos allowed for premium users'
          : 'Maximum 10 photos allowed. Upgrade to premium for unlimited photos.',
      );
    }

    // Upload to Cloudinary using UploadService
    const uploadResult = await this.uploadService.uploadImageWithBlur(file, 'profiles/photos') as { url: string; publicId: string };

    if (isPrimary) {
      // Unset other primary photos
      await this.prisma.photo.updateMany({
        where: { profileId: profile.id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const photo = await this.prisma.photo.create({
      data: {
        profileId: profile.id,
        url: uploadResult.url,
        cloudinaryId: uploadResult.publicId,
        isPrimary,
        isBlurred: true,
        isApproved: false,
        order: profile.photos.length,
      },
    });

    // Award achievement for first photo
    if (profile.photos.length === 0) {
      try {
        const { GamificationService } = await import('../gamification/gamification.service');
        const gamificationService = new GamificationService(this.prisma);
        await gamificationService.checkAndAwardAchievements(userId, 'PHOTO_UPLOADED');
      } catch (error) {
        // Silently fail
      }
    }

    return photo;
  }

  async deletePhoto(userId: string, photoId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const photo = await this.prisma.photo.findFirst({
      where: {
        id: photoId,
        profileId: profile.id,
      },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    await this.prisma.photo.delete({
      where: { id: photoId },
    });

    return { message: 'Photo deleted successfully' };
  }

  async setPrimaryPhoto(userId: string, photoId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const photo = await this.prisma.photo.findFirst({
      where: {
        id: photoId,
        profileId: profile.id,
      },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    // Unset other primary photos
    await this.prisma.photo.updateMany({
      where: { profileId: profile.id, isPrimary: true },
      data: { isPrimary: false },
    });

    // Set this photo as primary
    return this.prisma.photo.update({
      where: { id: photoId },
      data: { isPrimary: true },
    });
  }

  async uploadVideoIntro(userId: string, file: Express.Multer.File) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Validate file type (video files)
    if (!file.mimetype.startsWith('video/')) {
      throw new BadRequestException('Only video files are allowed');
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new BadRequestException('Video size should be less than 50MB');
    }

    // Delete old video if exists (optional cleanup)
    if (profile.videoIntroUrl) {
      try {
        // Extract publicId from Cloudinary URL
        // Cloudinary URLs format: https://res.cloudinary.com/cloudname/video/upload/v1234567890/folder/filename.mp4
        const urlMatch = profile.videoIntroUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/);
        if (urlMatch && urlMatch[1]) {
          const publicId = urlMatch[1].replace(/\.[^/.]+$/, ''); // Remove extension
          await this.uploadService.deleteImage(publicId);
        }
      } catch (error) {
        // Ignore deletion errors - old video will be orphaned but that's okay
        console.warn('Failed to delete old video (non-critical):', error);
      }
    }

    // Upload to Cloudinary
    const uploadResult = await this.uploadService.uploadVideo(file, 'profiles/video-intro') as { url: string; publicId: string };

    // Update profile with video URL
    const updatedProfile = await this.prisma.profile.update({
      where: { userId },
      data: {
        videoIntroUrl: uploadResult.url,
      },
      include: {
        photos: true,
        user: {
          select: {
            id: true,
            email: true,
            mobile: true,
          },
        },
      },
    });

    // Recalculate completeness score
    const completenessScore = this.calculateCompleteness(updatedProfile);
    await this.prisma.profile.update({
      where: { userId },
      data: { completenessScore } as any,
    });

    return updatedProfile;
  }

  async uploadBiodata(userId: string, file: Express.Multer.File) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Validate file type (PDF or Word documents)
    const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF and Word documents are allowed');
    }

    // Upload to Cloudinary
    const uploadResult = await this.uploadService.uploadDocument(file, 'profiles/biodata') as { url: string; publicId: string };

    return this.prisma.profile.update({
      where: { userId },
      data: {
        biodataUrl: uploadResult.url,
      },
    });
  }

  async updatePrivacySettings(userId: string, settings: any) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Update individual privacy fields from settings object
    const updateData: any = {
      privacySettings: settings,
    };

    // Update individual privacy fields if provided
    if (settings.isAnonymousViewing !== undefined) {
      updateData.isAnonymousViewing = settings.isAnonymousViewing;
    }
    if (settings.contactPrivacyLevel !== undefined) {
      updateData.contactPrivacyLevel = settings.contactPrivacyLevel;
    }
    if (settings.photoPrivacyLevel !== undefined) {
      updateData.photoPrivacyLevel = settings.photoPrivacyLevel;
    }

    return this.prisma.profile.update({
      where: { userId },
      data: updateData,
    });
  }

  async hideFromSearch(userId: string, hide: boolean) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.prisma.profile.update({
      where: { userId },
      data: {
        isHiddenFromSearch: hide,
      } as any,
    });
  }

  async downloadUserData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            photos: true,
          },
        },
        interests: {
          include: {
            toUser: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        receivedInterests: {
          include: {
            fromUser: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        chats: {
          include: {
            user1: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            user2: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        subscriptions: true,
        payments: true,
        profileViews: {
          include: {
            viewedBy: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove sensitive data
    const userData = {
      ...user,
      password: undefined,
      fcmToken: undefined,
    };

    return userData;
  }

  async deleteAccount(userId: string, password?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If password is provided, verify it
    if (password && user.password) {
      const bcrypt = require('bcrypt');
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new BadRequestException('Invalid password');
      }
    }

    // Soft delete - mark as deleted
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        email: `deleted_${Date.now()}_${user.email}`,
        mobile: user.mobile ? `deleted_${Date.now()}_${user.mobile}` : null,
      },
    });

    // Hide profile from search
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (profile) {
      await this.prisma.profile.update({
        where: { userId },
        data: {
          isHiddenFromSearch: true,
          status: 'SUSPENDED',
        } as any,
      });
    }

    return { message: 'Account deleted successfully' };
  }

  async submitForApproval(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Validate required fields
    const requiredFields = ['firstName', 'gender', 'dateOfBirth', 'religion', 'city'];
    const missingFields = requiredFields.filter(field => !profile[field]);

    if (missingFields.length > 0) {
      throw new BadRequestException(`Missing required fields: ${missingFields.join(', ')}`);
    }

    return this.prisma.profile.update({
      where: { userId },
      data: {
        status: 'PENDING_APPROVAL',
      },
    });
  }

  private generateSlug(firstName?: string, lastName?: string): string {
    const nameParts = [firstName, lastName].filter(Boolean).map(n => n?.trim()).filter(Boolean);
    const name = nameParts.length > 0 
      ? nameParts.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '-')
      : 'user';
    const random = Math.random().toString(36).substring(2, 8);
    return `${name}-${random}`;
  }

  private async trackProfileView(profileId: string, viewedById: string) {
    await this.prisma.profileView.upsert({
      where: {
        profileId_viewedById: {
          profileId,
          viewedById,
        },
      },
      create: {
        profileId,
        viewedById,
      },
      update: {
        createdAt: new Date(),
      },
    });
  }

  private async applyPrivacySettings(profile: any, isOwner: boolean, viewerId?: string) {
    if (isOwner) {
      return profile;
    }

    const privacySettings = profile.privacySettings || {};
    const filteredProfile = { ...profile };

    // Check if viewer can see contact information
    let canViewContact = false;
    if (viewerId && profile.user) {
      canViewContact = await this.canViewContact(viewerId, profile.userId);
    }

    // Hide contact info if not allowed
    if (!canViewContact && profile.user) {
      filteredProfile.user = {
        id: profile.user.id,
        isEmailVerified: profile.user.isEmailVerified,
        isMobileVerified: profile.user.isMobileVerified,
        preferredLanguage: profile.user.preferredLanguage,
      };
    }

    // Apply field-level privacy
    Object.keys(privacySettings).forEach(field => {
      if (privacySettings[field] === false) {
        delete filteredProfile[field];
      }
    });

    return filteredProfile;
  }

  private calculateCompleteness(profile: any): number {
    let score = 0;
    let totalFields = 0;

    // Basic Info (30 points)
    const basicFields = [
      { field: 'firstName', weight: 3 },
      { field: 'lastName', weight: 2 },
      { field: 'gender', weight: 3 },
      { field: 'dateOfBirth', weight: 3 },
      { field: 'height', weight: 2 },
      { field: 'maritalStatus', weight: 2 },
    ];
    basicFields.forEach(({ field, weight }) => {
      totalFields += weight;
      if (profile[field]) score += weight;
    });

    // Religion & Culture (15 points)
    const religionFields = [
      { field: 'religion', weight: 3 },
      { field: 'caste', weight: 2 },
      { field: 'motherTongue', weight: 2 },
      { field: 'manglik', weight: 1 },
      { field: 'gothra', weight: 1 },
    ];
    religionFields.forEach(({ field, weight }) => {
      totalFields += weight;
      if (profile[field] !== null && profile[field] !== undefined) score += weight;
    });

    // Location (10 points)
    const locationFields = [
      { field: 'country', weight: 2 },
      { field: 'state', weight: 2 },
      { field: 'city', weight: 3 },
      { field: 'citizenship', weight: 1 },
    ];
    locationFields.forEach(({ field, weight }) => {
      totalFields += weight;
      if (profile[field]) score += weight;
    });

    // Education & Career (15 points)
    const careerFields = [
      { field: 'education', weight: 3 },
      { field: 'college', weight: 2 },
      { field: 'occupation', weight: 3 },
      { field: 'income', weight: 2 },
    ];
    careerFields.forEach(({ field, weight }) => {
      totalFields += weight;
      if (profile[field]) score += weight;
    });

    // Family (10 points)
    const familyFields = [
      { field: 'fatherOccupation', weight: 2 },
      { field: 'motherOccupation', weight: 2 },
      { field: 'siblings', weight: 1 },
      { field: 'familyType', weight: 2 },
    ];
    familyFields.forEach(({ field, weight }) => {
      totalFields += weight;
      if (profile[field] !== null && profile[field] !== undefined) score += weight;
    });

    // Lifestyle (10 points)
    const lifestyleFields = [
      { field: 'diet', weight: 2 },
      { field: 'smoking', weight: 1 },
      { field: 'drinking', weight: 1 },
      { field: 'hobbies', weight: 2 },
    ];
    lifestyleFields.forEach(({ field, weight }) => {
      totalFields += weight;
      if (profile[field] !== null && profile[field] !== undefined) score += weight;
    });

    // Media (10 points)
    const photos = profile.photos || [];
    if (photos.length > 0) score += 5;
    if (photos.some((p: any) => p.isPrimary)) score += 2;
    if (profile.videoIntroUrl) score += 2;
    if ((profile as any).biodataUrl) score += 1;
    totalFields += 10;

    // Partner Preferences (bonus 5 points)
    if (profile.partnerPreferences) {
      const prefs = typeof profile.partnerPreferences === 'string' 
        ? JSON.parse(profile.partnerPreferences) 
        : profile.partnerPreferences;
      if (Object.keys(prefs).length > 0) score += 5;
    }
    totalFields += 5;

    return Math.round((score / totalFields) * 100);
  }

  async getCompletenessSuggestions(userId: string): Promise<string[]> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        photos: true,
      },
    });

    if (!profile) {
      return [];
    }

    const suggestions: string[] = [];

    // Basic Info
    if (!profile.firstName) suggestions.push('Add your first name (3 points)');
    if (!profile.lastName) suggestions.push('Add your last name (2 points)');
    if (!profile.gender) suggestions.push('Select your gender (3 points)');
    if (!profile.dateOfBirth) suggestions.push('Add your date of birth (3 points)');
    if (!profile.height) suggestions.push('Add your height (2 points)');
    if (!profile.maritalStatus) suggestions.push('Add your marital status (2 points)');
    
    // Religion & Culture
    if (!profile.religion) suggestions.push('Add your religion (3 points)');
    if (!profile.caste) suggestions.push('Add your caste (2 points)');
    if (!profile.motherTongue) suggestions.push('Add your mother tongue (2 points)');
    if (profile.manglik === null || profile.manglik === undefined) suggestions.push('Specify if you are manglik (1 point)');
    if (!profile.gothra) suggestions.push('Add your gothra (1 point)');
    
    // Location
    if (!profile.country) suggestions.push('Add your country (2 points)');
    if (!profile.state) suggestions.push('Add your state (2 points)');
    if (!profile.city) suggestions.push('Add your city (3 points)');
    if (!profile.citizenship) suggestions.push('Add your citizenship (1 point)');
    
    // Education & Career
    if (!profile.education) suggestions.push('Add your education (3 points)');
    if (!profile.college) suggestions.push('Add your college (2 points)');
    if (!profile.occupation) suggestions.push('Add your occupation (3 points)');
    if (!profile.income) suggestions.push('Add your income (2 points)');
    
    // Family
    if (!profile.fatherOccupation) suggestions.push('Add your father\'s occupation (2 points)');
    if (!profile.motherOccupation) suggestions.push('Add your mother\'s occupation (2 points)');
    if (profile.siblings === null || profile.siblings === undefined) suggestions.push('Add number of siblings (1 point)');
    if (!profile.familyType) suggestions.push('Add your family type (2 points)');
    
    // Lifestyle
    if (!profile.diet) suggestions.push('Add your diet preference (2 points)');
    if (profile.smoking === null || profile.smoking === undefined) suggestions.push('Specify if you smoke (1 point)');
    if (profile.drinking === null || profile.drinking === undefined) suggestions.push('Specify if you drink (1 point)');
    if (!profile.hobbies) suggestions.push('Add your hobbies (2 points)');
    
    // Media
    const photos = profile.photos || [];
    if (photos.length === 0) suggestions.push('Upload at least one photo (5 points)');
    if (photos.length > 0 && !photos.some(p => p.isPrimary)) suggestions.push('Set a primary photo (2 points)');
    if (!profile.videoIntroUrl) suggestions.push('Add a video introduction (2 points)');
    if (!(profile as any).biodataUrl) suggestions.push('Upload your biodata/resume (1 point)');
    
    // Partner Preferences
    if (!profile.partnerPreferences) {
      suggestions.push('Add partner preferences (5 points)');
    } else {
      const prefs = typeof profile.partnerPreferences === 'string' 
        ? JSON.parse(profile.partnerPreferences) 
        : profile.partnerPreferences;
      if (!prefs || Object.keys(prefs).length === 0) {
        suggestions.push('Add partner preferences (5 points)');
      }
    }

    return suggestions;
  }

  async getProfileViews(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const [views, total] = await Promise.all([
      this.prisma.profileView.findMany({
        where: { profileId: profile.id },
        include: {
          viewedBy: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  occupation: true,
                  dateOfBirth: true,
                  city: true,
                  photos: {
                    where: { isPrimary: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.profileView.count({
        where: { profileId: profile.id },
      }),
    ]);

    return {
      views,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProfileViewsStats(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    const [total, todayCount, weekCount, monthCount] = await Promise.all([
      this.prisma.profileView.count({
        where: { profileId: profile.id },
      }),
      this.prisma.profileView.count({
        where: {
          profileId: profile.id,
          createdAt: { gte: today },
        },
      }),
      this.prisma.profileView.count({
        where: {
          profileId: profile.id,
          createdAt: { gte: weekAgo },
        },
      }),
      this.prisma.profileView.count({
        where: {
          profileId: profile.id,
          createdAt: { gte: monthAgo },
        },
      }),
    ]);

    return {
      total,
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
    };
  }

  /**
   * Update photo album
   */
  async updatePhotoAlbum(userId: string, photoId: string, albumName?: string, caption?: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { photos: true },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const photo = profile.photos.find((p) => p.id === photoId);
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    return this.prisma.photo.update({
      where: { id: photoId },
      data: {
        albumName: albumName || (photo as any).albumName,
        caption: caption !== undefined ? caption : (photo as any).caption,
      } as any,
    });
  }

  /**
   * Get photos by album
   */
  async getPhotosByAlbum(userId: string, albumName?: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const where: any = { profileId: profile.id };
    if (albumName) {
      where.albumName = albumName;
    }

    return this.prisma.photo.findMany({
      where,
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Get testimonials for profile
   */
  async getTestimonials(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return (this.prisma as any).testimonial.findMany({
      where: {
        profileId: profile.id,
        isApproved: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Add testimonial (requires approval)
   */
  async addTestimonial(userId: string, data: { authorName: string; authorRelation?: string; authorEmail?: string; content: string; rating?: number }) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return (this.prisma as any).testimonial.create({
      data: {
        profileId: profile.id,
        authorName: data.authorName,
        authorRelation: data.authorRelation,
        authorEmail: data.authorEmail,
        content: data.content,
        rating: data.rating ? Number(data.rating) : null,
        isApproved: false, // Requires admin approval
      },
    });
  }

  /**
   * Export profile data (GDPR compliance)
   */
  async exportProfile(userId: string, format: string = 'json') {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        photos: true,
        user: {
          select: {
            id: true,
            email: true,
            mobile: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Create export record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // In production, generate actual PDF/JSON file and upload to storage
    // For now, return the data directly
    const exportData = {
      profile,
      exportedAt: new Date(),
      format,
    };

    await (this.prisma as any).profileExport.create({
      data: {
        userId,
        format: format.toUpperCase(),
        url: `data:application/${format};base64,${Buffer.from(JSON.stringify(exportData)).toString('base64')}`, // Placeholder
        expiresAt,
      },
    });

    return exportData;
  }

  /**
   * Check if a user can view contact information of another user
   * Based on subscription plan limits and privacy settings
   */
  async canViewContact(viewerId: string, profileUserId: string): Promise<boolean> {
    // Check if there's a mutual match (accepted interest both ways)
    const mutualMatch = await this.prisma.interest.findFirst({
      where: {
        OR: [
          { fromUserId: viewerId, toUserId: profileUserId, status: 'ACCEPTED' },
          { fromUserId: profileUserId, toUserId: viewerId, status: 'ACCEPTED' },
        ],
      },
    });

    // Get viewer's active subscription
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId: viewerId,
        status: 'ACTIVE',
        endDate: { gt: new Date() },
        plan: { not: 'FREE' },
      },
    });

    // If no subscription, cannot view contacts
    if (!subscription) {
      return false;
    }

    // Check privacy settings of profile owner
    const profile = await this.prisma.profile.findUnique({
      where: { userId: profileUserId },
      select: { contactPrivacyLevel: true },
    });

    if (!profile) {
      return false;
    }

    // Check privacy level
    if (profile.contactPrivacyLevel === 'NEVER') {
      return false;
    }

    if (profile.contactPrivacyLevel === 'AFTER_MATCH' && !mutualMatch) {
      return false;
    }

    if (profile.contactPrivacyLevel === 'PREMIUM_ONLY' && !subscription) {
      return false;
    }

    // Check subscription limits
    if (subscription.contactViewsLimit === null) {
      // Unlimited
      return true;
    }

    // Check if unlimited for matches
    const { PLAN_CONFIG } = await import('../payments/plan-config');
    const planConfig = PLAN_CONFIG[subscription.plan];
    if (planConfig?.features.contactViewsUnlimitedForMatches && mutualMatch) {
      return true;
    }

    // Check if within limit
    if (subscription.contactViewsUsed < subscription.contactViewsLimit) {
      return true;
    }

    return false;
  }

  /**
   * Unlock/view contact information (tracks usage)
   */
  async unlockContact(viewerId: string, profileUserId: string) {
    if (viewerId === profileUserId) {
      throw new BadRequestException('Cannot unlock own contact information');
    }

    const canView = await this.canViewContact(viewerId, profileUserId);
    if (!canView) {
      throw new ForbiddenException('Contact information not available. Upgrade your plan or wait for mutual match.');
    }

    // Get subscription
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId: viewerId,
        status: 'ACTIVE',
        endDate: { gt: new Date() },
        plan: { not: 'FREE' },
      },
    });

    if (!subscription) {
      throw new ForbiddenException('Active subscription required');
    }

    // Check if already viewed (to avoid double counting)
    const existingView = await this.prisma.contactView.findUnique({
      where: {
        subscriptionId_profileId_viewedById: {
          subscriptionId: subscription.id,
          profileId: profileUserId,
          viewedById: viewerId,
        },
      },
    });

    if (!existingView) {
      // Check if unlimited for matches
      const { PLAN_CONFIG } = await import('../payments/plan-config');
      const planConfig = PLAN_CONFIG[subscription.plan];
      const mutualMatch = await this.prisma.interest.findFirst({
        where: {
          OR: [
            { fromUserId: viewerId, toUserId: profileUserId, status: 'ACCEPTED' },
            { fromUserId: profileUserId, toUserId: viewerId, status: 'ACCEPTED' },
          ],
        },
      });

      // Only count if not unlimited for matches
      if (!(planConfig?.features.contactViewsUnlimitedForMatches && mutualMatch)) {
        // Increment usage
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { contactViewsUsed: { increment: 1 } },
        });

        // Record the view
        await this.prisma.contactView.create({
          data: {
            subscriptionId: subscription.id,
            profileId: profileUserId,
            viewedById: viewerId,
          },
        });
      }
    }

    // Get contact information
    const user = await this.prisma.user.findUnique({
      where: { id: profileUserId },
      select: {
        email: true,
        mobile: true,
        isEmailVerified: true,
        isMobileVerified: true,
      },
    });

    return user;
  }
}

