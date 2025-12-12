"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfilesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const upload_service_1 = require("../upload/upload.service");
const subscription_constants_1 = require("../common/constants/subscription.constants");
let ProfilesService = class ProfilesService {
    constructor(prisma, uploadService) {
        this.prisma = prisma;
        this.uploadService = uploadService;
    }
    async createProfile(userId, dto) {
        const existingProfile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (existingProfile) {
            throw new common_1.BadRequestException('Profile already exists');
        }
        const slug = this.generateSlug(dto.firstName, dto.lastName);
        const profileData = {
            userId,
            ...dto,
            slug,
            status: client_1.ProfileStatus.DRAFT,
        };
        Object.keys(profileData).forEach(key => {
            if (typeof profileData[key] === 'string') {
                profileData[key] = profileData[key].trim();
            }
        });
        if (profileData.dateOfBirth && typeof profileData.dateOfBirth === 'string') {
            const date = new Date(profileData.dateOfBirth);
            if (isNaN(date.getTime())) {
                throw new common_1.BadRequestException('Invalid dateOfBirth format. Expected ISO-8601 date string.');
            }
            profileData.dateOfBirth = date;
        }
        Object.keys(profileData).forEach(key => {
            if (profileData[key] === undefined) {
                delete profileData[key];
            }
            if (profileData[key] === '' && ['gender', 'maritalStatus', 'familyType', 'diet'].includes(key)) {
                delete profileData[key];
            }
        });
        try {
            console.log('Creating profile with data:', JSON.stringify(profileData, null, 2));
            const profile = await this.prisma.profile.create({
                data: profileData,
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
            const completenessScore = this.calculateCompleteness(createdProfile);
            await this.prisma.profile.update({
                where: { id: profile.id },
                data: { completenessScore },
            });
            if (completenessScore >= 100) {
                try {
                    const { GamificationService } = await Promise.resolve().then(() => __importStar(require('../gamification/gamification.service')));
                    const gamificationService = new GamificationService(this.prisma);
                    await gamificationService.checkAndAwardAchievements(userId, 'PROFILE_COMPLETE');
                }
                catch (error) {
                }
            }
            return { ...createdProfile, completenessScore };
        }
        catch (error) {
            console.error('Prisma error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Error meta:', error.meta);
            if (error.code === 'P2002') {
                const newSlug = this.generateSlug(dto.firstName, dto.lastName);
                profileData.slug = newSlug;
                try {
                    const profile = await this.prisma.profile.create({
                        data: profileData,
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
                }
                catch (retryError) {
                    console.error('Retry error:', retryError);
                    throw new common_1.BadRequestException(`Failed to create profile: ${retryError.message}`);
                }
            }
            if (error.code === 'P2003' || error.code === 'P2011') {
                throw new common_1.BadRequestException(`Invalid data: ${error.message}`);
            }
            throw new common_1.BadRequestException(`Failed to create profile: ${error.message || 'Unknown error'}`);
        }
    }
    async updateProfile(userId, dto) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const updateData = { ...dto };
        if (dto.firstName || dto.lastName) {
            updateData.slug = this.generateSlug(dto.firstName || profile.firstName, dto.lastName || profile.lastName);
        }
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
        const completenessScore = this.calculateCompleteness(updatedProfile);
        await this.prisma.profile.update({
            where: { userId },
            data: { completenessScore },
        });
        return { ...updatedProfile, completenessScore };
    }
    async getProfile(userId, viewerId) {
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
        if (!profile) {
            if (viewerId === userId) {
                return null;
            }
            throw new common_1.NotFoundException('Profile not found');
        }
        if (viewerId && viewerId !== userId) {
            await this.trackProfileView(profile.id, viewerId);
        }
        return this.applyPrivacySettings(profile, viewerId === userId, viewerId);
    }
    async getProfileBySlug(slug) {
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
            throw new common_1.NotFoundException('Profile not found');
        }
        return profile;
    }
    async uploadPhoto(userId, file, isPrimary = false) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
            include: { photos: true },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscriptions: {
                    where: {
                        status: 'ACTIVE',
                        endDate: { gt: new Date() },
                        plan: { in: [...subscription_constants_1.PAID_SUBSCRIPTION_PLANS] },
                    },
                },
            },
        });
        const hasPaidPlan = user?.subscriptions.length > 0;
        const maxPhotos = hasPaidPlan ? 50 : 10;
        if (profile.photos.length >= maxPhotos) {
            throw new common_1.BadRequestException(hasPaidPlan
                ? 'Maximum 50 photos allowed for premium users'
                : 'Maximum 10 photos allowed. Upgrade to premium for unlimited photos.');
        }
        const uploadResult = await this.uploadService.uploadImageWithBlur(file, 'profiles/photos');
        if (isPrimary) {
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
        if (profile.photos.length === 0) {
            try {
                const { GamificationService } = await Promise.resolve().then(() => __importStar(require('../gamification/gamification.service')));
                const gamificationService = new GamificationService(this.prisma);
                await gamificationService.checkAndAwardAchievements(userId, 'PHOTO_UPLOADED');
            }
            catch (error) {
            }
        }
        return photo;
    }
    async deletePhoto(userId, photoId) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const photo = await this.prisma.photo.findFirst({
            where: {
                id: photoId,
                profileId: profile.id,
            },
        });
        if (!photo) {
            throw new common_1.NotFoundException('Photo not found');
        }
        await this.prisma.photo.delete({
            where: { id: photoId },
        });
        return { message: 'Photo deleted successfully' };
    }
    async setPrimaryPhoto(userId, photoId) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const photo = await this.prisma.photo.findFirst({
            where: {
                id: photoId,
                profileId: profile.id,
            },
        });
        if (!photo) {
            throw new common_1.NotFoundException('Photo not found');
        }
        await this.prisma.photo.updateMany({
            where: { profileId: profile.id, isPrimary: true },
            data: { isPrimary: false },
        });
        return this.prisma.photo.update({
            where: { id: photoId },
            data: { isPrimary: true },
        });
    }
    async uploadVideoIntro(userId, file) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        if (!file.mimetype.startsWith('video/')) {
            throw new common_1.BadRequestException('Only video files are allowed');
        }
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new common_1.BadRequestException('Video size should be less than 50MB');
        }
        if (profile.videoIntroUrl) {
            try {
                const urlMatch = profile.videoIntroUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/);
                if (urlMatch && urlMatch[1]) {
                    const publicId = urlMatch[1].replace(/\.[^/.]+$/, '');
                    await this.uploadService.deleteImage(publicId);
                }
            }
            catch (error) {
                console.warn('Failed to delete old video (non-critical):', error);
            }
        }
        const uploadResult = await this.uploadService.uploadVideo(file, 'profiles/video-intro');
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
        const completenessScore = this.calculateCompleteness(updatedProfile);
        await this.prisma.profile.update({
            where: { userId },
            data: { completenessScore },
        });
        return updatedProfile;
    }
    async uploadBiodata(userId, file) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Only PDF and Word documents are allowed');
        }
        const uploadResult = await this.uploadService.uploadDocument(file, 'profiles/biodata');
        return this.prisma.profile.update({
            where: { userId },
            data: {
                biodataUrl: uploadResult.url,
            },
        });
    }
    async updatePrivacySettings(userId, settings) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const updateData = {
            privacySettings: settings,
        };
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
    async hideFromSearch(userId, hide) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        return this.prisma.profile.update({
            where: { userId },
            data: {
                isHiddenFromSearch: hide,
            },
        });
    }
    async downloadUserData(userId) {
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
            throw new common_1.NotFoundException('User not found');
        }
        const userData = {
            ...user,
            password: undefined,
            fcmToken: undefined,
        };
        return userData;
    }
    async deleteAccount(userId, password) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (password && user.password) {
            const bcrypt = require('bcrypt');
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                throw new common_1.BadRequestException('Invalid password');
            }
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                deletedAt: new Date(),
                email: `deleted_${Date.now()}_${user.email}`,
                mobile: user.mobile ? `deleted_${Date.now()}_${user.mobile}` : null,
            },
        });
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (profile) {
            await this.prisma.profile.update({
                where: { userId },
                data: {
                    isHiddenFromSearch: true,
                    status: 'SUSPENDED',
                },
            });
        }
        return { message: 'Account deleted successfully' };
    }
    async submitForApproval(userId) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const requiredFields = ['firstName', 'gender', 'dateOfBirth', 'religion', 'city'];
        const missingFields = requiredFields.filter(field => !profile[field]);
        if (missingFields.length > 0) {
            throw new common_1.BadRequestException(`Missing required fields: ${missingFields.join(', ')}`);
        }
        return this.prisma.profile.update({
            where: { userId },
            data: {
                status: 'PENDING_APPROVAL',
            },
        });
    }
    generateSlug(firstName, lastName) {
        const nameParts = [firstName, lastName].filter(Boolean).map(n => n?.trim()).filter(Boolean);
        const name = nameParts.length > 0
            ? nameParts.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '-')
            : 'user';
        const random = Math.random().toString(36).substring(2, 8);
        return `${name}-${random}`;
    }
    async trackProfileView(profileId, viewedById) {
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
    async applyPrivacySettings(profile, isOwner, viewerId) {
        if (isOwner) {
            return profile;
        }
        const privacySettings = profile.privacySettings || {};
        const filteredProfile = { ...profile };
        let canViewContact = false;
        if (viewerId && profile.user) {
            canViewContact = await this.canViewContact(viewerId, profile.userId);
        }
        if (!canViewContact && profile.user) {
            filteredProfile.user = {
                id: profile.user.id,
                isEmailVerified: profile.user.isEmailVerified,
                isMobileVerified: profile.user.isMobileVerified,
                preferredLanguage: profile.user.preferredLanguage,
            };
        }
        Object.keys(privacySettings).forEach(field => {
            if (privacySettings[field] === false) {
                delete filteredProfile[field];
            }
        });
        return filteredProfile;
    }
    calculateCompleteness(profile) {
        let score = 0;
        let totalFields = 0;
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
            if (profile[field])
                score += weight;
        });
        const religionFields = [
            { field: 'religion', weight: 3 },
            { field: 'caste', weight: 2 },
            { field: 'motherTongue', weight: 2 },
            { field: 'manglik', weight: 1 },
            { field: 'gothra', weight: 1 },
        ];
        religionFields.forEach(({ field, weight }) => {
            totalFields += weight;
            if (profile[field] !== null && profile[field] !== undefined)
                score += weight;
        });
        const locationFields = [
            { field: 'country', weight: 2 },
            { field: 'state', weight: 2 },
            { field: 'city', weight: 3 },
            { field: 'citizenship', weight: 1 },
        ];
        locationFields.forEach(({ field, weight }) => {
            totalFields += weight;
            if (profile[field])
                score += weight;
        });
        const careerFields = [
            { field: 'education', weight: 3 },
            { field: 'college', weight: 2 },
            { field: 'occupation', weight: 3 },
            { field: 'income', weight: 2 },
        ];
        careerFields.forEach(({ field, weight }) => {
            totalFields += weight;
            if (profile[field])
                score += weight;
        });
        const familyFields = [
            { field: 'fatherOccupation', weight: 2 },
            { field: 'motherOccupation', weight: 2 },
            { field: 'siblings', weight: 1 },
            { field: 'familyType', weight: 2 },
        ];
        familyFields.forEach(({ field, weight }) => {
            totalFields += weight;
            if (profile[field] !== null && profile[field] !== undefined)
                score += weight;
        });
        const lifestyleFields = [
            { field: 'diet', weight: 2 },
            { field: 'smoking', weight: 1 },
            { field: 'drinking', weight: 1 },
            { field: 'hobbies', weight: 2 },
        ];
        lifestyleFields.forEach(({ field, weight }) => {
            totalFields += weight;
            if (profile[field] !== null && profile[field] !== undefined)
                score += weight;
        });
        const photos = profile.photos || [];
        if (photos.length > 0)
            score += 5;
        if (photos.some((p) => p.isPrimary))
            score += 2;
        if (profile.videoIntroUrl)
            score += 2;
        if (profile.biodataUrl)
            score += 1;
        totalFields += 10;
        if (profile.partnerPreferences) {
            const prefs = typeof profile.partnerPreferences === 'string'
                ? JSON.parse(profile.partnerPreferences)
                : profile.partnerPreferences;
            if (Object.keys(prefs).length > 0)
                score += 5;
        }
        totalFields += 5;
        return Math.round((score / totalFields) * 100);
    }
    async getCompletenessSuggestions(userId) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
            include: {
                photos: true,
            },
        });
        if (!profile) {
            return [];
        }
        const suggestions = [];
        if (!profile.firstName)
            suggestions.push('Add your first name (3 points)');
        if (!profile.lastName)
            suggestions.push('Add your last name (2 points)');
        if (!profile.gender)
            suggestions.push('Select your gender (3 points)');
        if (!profile.dateOfBirth)
            suggestions.push('Add your date of birth (3 points)');
        if (!profile.height)
            suggestions.push('Add your height (2 points)');
        if (!profile.maritalStatus)
            suggestions.push('Add your marital status (2 points)');
        if (!profile.religion)
            suggestions.push('Add your religion (3 points)');
        if (!profile.caste)
            suggestions.push('Add your caste (2 points)');
        if (!profile.motherTongue)
            suggestions.push('Add your mother tongue (2 points)');
        if (profile.manglik === null || profile.manglik === undefined)
            suggestions.push('Specify if you are manglik (1 point)');
        if (!profile.gothra)
            suggestions.push('Add your gothra (1 point)');
        if (!profile.country)
            suggestions.push('Add your country (2 points)');
        if (!profile.state)
            suggestions.push('Add your state (2 points)');
        if (!profile.city)
            suggestions.push('Add your city (3 points)');
        if (!profile.citizenship)
            suggestions.push('Add your citizenship (1 point)');
        if (!profile.education)
            suggestions.push('Add your education (3 points)');
        if (!profile.college)
            suggestions.push('Add your college (2 points)');
        if (!profile.occupation)
            suggestions.push('Add your occupation (3 points)');
        if (!profile.income)
            suggestions.push('Add your income (2 points)');
        if (!profile.fatherOccupation)
            suggestions.push('Add your father\'s occupation (2 points)');
        if (!profile.motherOccupation)
            suggestions.push('Add your mother\'s occupation (2 points)');
        if (profile.siblings === null || profile.siblings === undefined)
            suggestions.push('Add number of siblings (1 point)');
        if (!profile.familyType)
            suggestions.push('Add your family type (2 points)');
        if (!profile.diet)
            suggestions.push('Add your diet preference (2 points)');
        if (profile.smoking === null || profile.smoking === undefined)
            suggestions.push('Specify if you smoke (1 point)');
        if (profile.drinking === null || profile.drinking === undefined)
            suggestions.push('Specify if you drink (1 point)');
        if (!profile.hobbies)
            suggestions.push('Add your hobbies (2 points)');
        const photos = profile.photos || [];
        if (photos.length === 0)
            suggestions.push('Upload at least one photo (5 points)');
        if (photos.length > 0 && !photos.some(p => p.isPrimary))
            suggestions.push('Set a primary photo (2 points)');
        if (!profile.videoIntroUrl)
            suggestions.push('Add a video introduction (2 points)');
        if (!profile.biodataUrl)
            suggestions.push('Upload your biodata/resume (1 point)');
        if (!profile.partnerPreferences) {
            suggestions.push('Add partner preferences (5 points)');
        }
        else {
            const prefs = typeof profile.partnerPreferences === 'string'
                ? JSON.parse(profile.partnerPreferences)
                : profile.partnerPreferences;
            if (!prefs || Object.keys(prefs).length === 0) {
                suggestions.push('Add partner preferences (5 points)');
            }
        }
        return suggestions;
    }
    async getProfileViews(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
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
    async getProfileViewsStats(userId) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
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
    async updatePhotoAlbum(userId, photoId, albumName, caption) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
            include: { photos: true },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const photo = profile.photos.find((p) => p.id === photoId);
        if (!photo) {
            throw new common_1.NotFoundException('Photo not found');
        }
        return this.prisma.photo.update({
            where: { id: photoId },
            data: {
                albumName: albumName || photo.albumName,
                caption: caption !== undefined ? caption : photo.caption,
            },
        });
    }
    async getPhotosByAlbum(userId, albumName) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const where = { profileId: profile.id };
        if (albumName) {
            where.albumName = albumName;
        }
        return this.prisma.photo.findMany({
            where,
            orderBy: { order: 'asc' },
        });
    }
    async getTestimonials(userId) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        return this.prisma.testimonial.findMany({
            where: {
                profileId: profile.id,
                isApproved: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async addTestimonial(userId, data) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        return this.prisma.testimonial.create({
            data: {
                profileId: profile.id,
                authorName: data.authorName,
                authorRelation: data.authorRelation,
                authorEmail: data.authorEmail,
                content: data.content,
                rating: data.rating ? Number(data.rating) : null,
                isApproved: false,
            },
        });
    }
    async exportProfile(userId, format = 'json') {
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
            throw new common_1.NotFoundException('Profile not found');
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const exportData = {
            profile,
            exportedAt: new Date(),
            format,
        };
        await this.prisma.profileExport.create({
            data: {
                userId,
                format: format.toUpperCase(),
                url: `data:application/${format};base64,${Buffer.from(JSON.stringify(exportData)).toString('base64')}`,
                expiresAt,
            },
        });
        return exportData;
    }
    async canViewContact(viewerId, profileUserId) {
        const mutualMatch = await this.prisma.interest.findFirst({
            where: {
                OR: [
                    { fromUserId: viewerId, toUserId: profileUserId, status: 'ACCEPTED' },
                    { fromUserId: profileUserId, toUserId: viewerId, status: 'ACCEPTED' },
                ],
            },
        });
        const subscription = await this.prisma.subscription.findFirst({
            where: {
                userId: viewerId,
                status: 'ACTIVE',
                endDate: { gt: new Date() },
                plan: { not: 'FREE' },
            },
        });
        if (!subscription) {
            return false;
        }
        const profile = await this.prisma.profile.findUnique({
            where: { userId: profileUserId },
            select: { contactPrivacyLevel: true },
        });
        if (!profile) {
            return false;
        }
        if (profile.contactPrivacyLevel === 'NEVER') {
            return false;
        }
        if (profile.contactPrivacyLevel === 'AFTER_MATCH' && !mutualMatch) {
            return false;
        }
        if (profile.contactPrivacyLevel === 'PREMIUM_ONLY' && !subscription) {
            return false;
        }
        if (subscription.contactViewsLimit === null) {
            return true;
        }
        const { PLAN_CONFIG } = await Promise.resolve().then(() => __importStar(require('../payments/plan-config')));
        const planConfig = PLAN_CONFIG[subscription.plan];
        if (planConfig?.features.contactViewsUnlimitedForMatches && mutualMatch) {
            return true;
        }
        if (subscription.contactViewsUsed < subscription.contactViewsLimit) {
            return true;
        }
        return false;
    }
    async unlockContact(viewerId, profileUserId) {
        if (viewerId === profileUserId) {
            throw new common_1.BadRequestException('Cannot unlock own contact information');
        }
        const canView = await this.canViewContact(viewerId, profileUserId);
        if (!canView) {
            throw new common_1.ForbiddenException('Contact information not available. Upgrade your plan or wait for mutual match.');
        }
        const subscription = await this.prisma.subscription.findFirst({
            where: {
                userId: viewerId,
                status: 'ACTIVE',
                endDate: { gt: new Date() },
                plan: { not: 'FREE' },
            },
        });
        if (!subscription) {
            throw new common_1.ForbiddenException('Active subscription required');
        }
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
            const { PLAN_CONFIG } = await Promise.resolve().then(() => __importStar(require('../payments/plan-config')));
            const planConfig = PLAN_CONFIG[subscription.plan];
            const mutualMatch = await this.prisma.interest.findFirst({
                where: {
                    OR: [
                        { fromUserId: viewerId, toUserId: profileUserId, status: 'ACCEPTED' },
                        { fromUserId: profileUserId, toUserId: viewerId, status: 'ACCEPTED' },
                    ],
                },
            });
            if (!(planConfig?.features.contactViewsUnlimitedForMatches && mutualMatch)) {
                await this.prisma.subscription.update({
                    where: { id: subscription.id },
                    data: { contactViewsUsed: { increment: 1 } },
                });
                await this.prisma.contactView.create({
                    data: {
                        subscriptionId: subscription.id,
                        profileId: profileUserId,
                        viewedById: viewerId,
                    },
                });
            }
        }
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
};
exports.ProfilesService = ProfilesService;
exports.ProfilesService = ProfilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        upload_service_1.UploadService])
], ProfilesService);
//# sourceMappingURL=profiles.service.js.map