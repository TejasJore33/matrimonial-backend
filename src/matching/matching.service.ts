import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate match score between two profiles
   */
  async calculateMatchScore(userId: string, matchedUserId: string): Promise<any> {
    const [userProfile, matchedProfile] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { userId },
        include: { user: true },
      }),
      this.prisma.profile.findUnique({
        where: { userId: matchedUserId },
        include: { user: true },
      }),
    ]);

    if (!userProfile || !matchedProfile) {
      throw new NotFoundException('Profile not found');
    }

    const scores = {
      religion: this.calculateReligionScore(userProfile, matchedProfile),
      education: this.calculateEducationScore(userProfile, matchedProfile),
      lifestyle: this.calculateLifestyleScore(userProfile, matchedProfile),
      location: this.calculateLocationScore(userProfile, matchedProfile),
      family: this.calculateFamilyScore(userProfile, matchedProfile),
    };

    const overallScore = Math.round(
      (scores.religion * 0.25 +
        scores.education * 0.20 +
        scores.lifestyle * 0.20 +
        scores.location * 0.15 +
        scores.family * 0.20)
    );

    const matchReasons = this.generateMatchReasons(userProfile, matchedProfile, scores);
    const isReverseMatch = await this.checkReverseMatch(userId, matchedUserId, matchedProfile);

    // Save or update match score
    // Note: After running migration, this will be available as matchScore (camelCase)
    await (this.prisma as any).matchScore.upsert({
      where: {
        userId_matchedUserId: {
          userId,
          matchedUserId,
        },
      },
      create: {
        userId,
        matchedUserId,
        overallScore,
        religionScore: scores.religion,
        educationScore: scores.education,
        lifestyleScore: scores.lifestyle,
        locationScore: scores.location,
        familyScore: scores.family,
        matchReasons,
        isReverseMatch,
      },
      update: {
        overallScore,
        religionScore: scores.religion,
        educationScore: scores.education,
        lifestyleScore: scores.lifestyle,
        locationScore: scores.location,
        familyScore: scores.family,
        matchReasons,
        isReverseMatch,
        updatedAt: new Date(),
      },
    });

    return {
      overallScore,
      scores,
      matchReasons,
      isReverseMatch,
    };
  }

  /**
   * Calculate religion compatibility (0-100)
   */
  private calculateReligionScore(profile1: any, profile2: any): number {
    let score = 0;
    if (profile1.religion && profile2.religion) {
      if (profile1.religion === profile2.religion) score += 40;
      else score += 10; // Different religion
    }

    if (profile1.caste && profile2.caste) {
      if (profile1.caste === profile2.caste) score += 30;
      else score += 5;
    }

    if (profile1.motherTongue && profile2.motherTongue) {
      if (profile1.motherTongue === profile2.motherTongue) score += 20;
      else score += 5;
    }

    if (profile1.manglik !== undefined && profile2.manglik !== undefined) {
      if (profile1.manglik === profile2.manglik) score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate education compatibility (0-100)
   */
  private calculateEducationScore(profile1: any, profile2: any): number {
    let score = 50; // Base score

    if (profile1.education && profile2.education) {
      const edu1 = profile1.education.toLowerCase();
      const edu2 = profile2.education.toLowerCase();

      // Exact match
      if (edu1 === edu2) {
        score = 100;
      } else {
        // Similar education levels
        const levels = {
          phd: 90,
          'post graduate': 80,
          'graduate': 70,
          'diploma': 60,
          '12th': 50,
        };

        const level1 = Object.keys(levels).find((l) => edu1.includes(l));
        const level2 = Object.keys(levels).find((l) => edu2.includes(l));

        if (level1 && level2) {
          const diff = Math.abs(levels[level1] - levels[level2]);
          score = 100 - diff;
        }
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate lifestyle compatibility (0-100)
   */
  private calculateLifestyleScore(profile1: any, profile2: any): number {
    let score = 0;

    // Diet match
    if (profile1.diet && profile2.diet) {
      if (profile1.diet === profile2.diet) score += 30;
      else if (
        (profile1.diet === 'VEGETARIAN' && profile2.diet === 'EGGETARIAN') ||
        (profile1.diet === 'EGGETARIAN' && profile2.diet === 'VEGETARIAN')
      ) {
        score += 20;
      } else {
        score += 5;
      }
    }

    // Smoking match
    if (profile1.smoking !== undefined && profile2.smoking !== undefined) {
      if (profile1.smoking === profile2.smoking) score += 25;
      else score += 5;
    }

    // Drinking match
    if (profile1.drinking !== undefined && profile2.drinking !== undefined) {
      if (profile1.drinking === profile2.drinking) score += 25;
      else score += 5;
    }

    // Hobbies match
    if (profile1.hobbies && profile2.hobbies) {
      try {
        const hobbies1 = JSON.parse(profile1.hobbies);
        const hobbies2 = JSON.parse(profile2.hobbies);
        if (Array.isArray(hobbies1) && Array.isArray(hobbies2)) {
          const commonHobbies = hobbies1.filter((h: string) => hobbies2.includes(h));
          if (commonHobbies.length > 0) {
            score += Math.min(20, commonHobbies.length * 5);
          }
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calculate location compatibility (0-100)
   */
  private calculateLocationScore(profile1: any, profile2: any): number {
    let score = 0;

    // Same city
    if (profile1.city && profile2.city && profile1.city === profile2.city) {
      score += 50;
    }

    // Same state
    if (profile1.state && profile2.state && profile1.state === profile2.state) {
      score += 30;
    }

    // Same country
    if (profile1.country && profile2.country && profile1.country === profile2.country) {
      score += 20;
    }

    // Distance calculation if coordinates available
    if (profile1.latitude && profile1.longitude && profile2.latitude && profile2.longitude) {
      const distance = this.calculateDistance(
        profile1.latitude,
        profile1.longitude,
        profile2.latitude,
        profile2.longitude,
      );
      // Closer = higher score (max 50km = 100 points)
      if (distance < 50) {
        score += Math.max(0, 50 - distance);
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calculate family compatibility (0-100)
   */
  private calculateFamilyScore(profile1: any, profile2: any): number {
    let score = 50; // Base score

    // Family type match
    if (profile1.familyType && profile2.familyType) {
      if (profile1.familyType === profile2.familyType) score += 30;
      else score += 10;
    }

    // Similar family background (occupation)
    if (profile1.fatherOccupation && profile2.fatherOccupation) {
      if (profile1.fatherOccupation === profile2.fatherOccupation) score += 20;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Generate match reasons
   */
  private generateMatchReasons(profile1: any, profile2: any, scores: any): string[] {
    const reasons: string[] = [];

    if (scores.religion >= 70) {
      reasons.push('Strong religious compatibility');
    }
    if (scores.education >= 80) {
      reasons.push('Similar educational background');
    }
    if (scores.lifestyle >= 70) {
      reasons.push('Compatible lifestyle preferences');
    }
    if (scores.location >= 60) {
      reasons.push('Located in the same region');
    }
    if (scores.family >= 70) {
      reasons.push('Similar family values');
    }

    if (profile1.manglik === profile2.manglik && profile1.manglik === false) {
      reasons.push('Manglik compatibility');
    }

    return reasons;
  }

  /**
   * Check if reverse match (matched user also matches this user's preferences)
   */
  private async checkReverseMatch(userId: string, matchedUserId: string, matchedProfile: any): Promise<boolean> {
    const userProfile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!userProfile || !userProfile.partnerPreferences) {
      return false;
    }

    try {
      const preferences = userProfile.partnerPreferences as any;

      // Check basic criteria
      if (preferences.gender && matchedProfile.gender !== preferences.gender) {
        return false;
      }

      if (preferences.religion && matchedProfile.religion !== preferences.religion) {
        return false;
      }

      if (preferences.minAge || preferences.maxAge) {
        const age = this.calculateAge(matchedProfile.dateOfBirth);
        if (preferences.minAge && age < preferences.minAge) return false;
        if (preferences.maxAge && age > preferences.maxAge) return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  private calculateAge(dateOfBirth: Date | null | undefined): number {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Get match scores for a user
   */
  async getUserMatchScores(userId: string, limit: number = 20) {
    return (this.prisma as any).matchScore.findMany({
      where: { userId },
      include: {
        matchedUser: {
          include: {
            profile: {
              include: {
                photos: {
                  where: { isApproved: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { overallScore: 'desc' },
      take: limit,
    });
  }

  /**
   * Get reverse matches (profiles that match user's preferences)
   */
  async getReverseMatches(userId: string, limit: number = 20) {
    const userProfile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!userProfile || !userProfile.partnerPreferences) {
      return [];
    }

    const preferences = userProfile.partnerPreferences as any;
    const where: any = {
      userId: { not: userId },
      status: 'ACTIVE',
      isHiddenFromSearch: false,
    };

    if (preferences.gender) {
      where.gender = preferences.gender;
    }

    if (preferences.religion) {
      where.religion = preferences.religion;
    }

    // Age filter
    if (preferences.minAge || preferences.maxAge) {
      const now = new Date();
      if (preferences.maxAge) {
        const minDate = new Date(now.getFullYear() - preferences.maxAge - 1, now.getMonth(), now.getDate());
        where.dateOfBirth = { ...where.dateOfBirth, gte: minDate };
      }
      if (preferences.minAge) {
        const maxDate = new Date(now.getFullYear() - preferences.minAge, now.getMonth(), now.getDate());
        where.dateOfBirth = { ...where.dateOfBirth, lte: maxDate };
      }
    }

    const profiles = await this.prisma.profile.findMany({
      where,
      include: {
        user: true,
        photos: {
          where: { isApproved: true },
          take: 1,
        },
      },
      take: limit,
    });

    // Calculate match scores for each
    const matches = await Promise.all(
      profiles.map(async (profile) => {
        const matchScore = await this.calculateMatchScore(userId, profile.userId);
        return {
          profile,
          matchScore: matchScore.overallScore,
          isReverseMatch: true,
        };
      }),
    );

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }
}

