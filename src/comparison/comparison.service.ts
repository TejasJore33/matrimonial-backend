import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComparisonService {
  constructor(private prisma: PrismaService) {}

  async compareProfiles(userId: string, profileIds: string[]) {
    if (profileIds.length < 2 || profileIds.length > 3) {
      throw new BadRequestException('Can compare 2-3 profiles at a time');
    }

    // Get all profiles
    const profiles = await Promise.all(
      profileIds.map(id =>
        this.prisma.profile.findUnique({
          where: { userId: id },
          include: {
            photos: {
              where: { isPrimary: true },
              take: 1,
            },
            user: {
              select: {
                id: true,
                email: true,
                mobile: true,
              },
            },
          },
        }),
      ),
    );

    // Check if all profiles exist
    if (profiles.some(p => !p)) {
      throw new NotFoundException('One or more profiles not found');
    }

    // Create comparison data
    const comparison = profiles.map((profile, index) => ({
      profileId: profile.userId,
      name: `${profile.firstName} ${profile.lastName}`,
      age: profile.dateOfBirth ? this.calculateAge(profile.dateOfBirth) : null,
      height: profile.height,
      education: profile.education,
      occupation: profile.occupation,
      income: profile.income,
      location: `${profile.city}, ${profile.state}`,
      religion: profile.religion,
      caste: profile.caste,
      motherTongue: profile.motherTongue,
      maritalStatus: profile.maritalStatus,
      familyType: profile.familyType,
      diet: profile.diet,
      smoking: profile.smoking,
      drinking: profile.drinking,
      photo: profile.photos[0]?.url,
    }));

    // Save comparison for user
    for (const profileId of profileIds) {
      await (this.prisma as any).profileComparison.upsert({
        where: {
          userId_profileId: {
            userId,
            profileId,
          },
        },
        create: {
          userId,
          profileId,
          comparisonData: comparison,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        update: {
          comparisonData: comparison,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return {
      profiles: comparison,
      differences: this.findDifferences(profiles),
    };
  }

  async getComparisonHistory(userId: string) {
    return (this.prisma as any).profileComparison.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      include: {
        profile: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            photos: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private findDifferences(profiles: any[]) {
    const differences: any = {};

    const fields = ['height', 'education', 'occupation', 'income', 'religion', 'caste', 'motherTongue', 'maritalStatus', 'familyType', 'diet'];

    fields.forEach(field => {
      const values = profiles.map(p => p[field]).filter(v => v !== null && v !== undefined);
      if (new Set(values).size > 1) {
        differences[field] = {
          hasDifference: true,
          values: profiles.map((p, i) => ({
            profileIndex: i,
            value: p[field],
          })),
        };
      }
    });

    return differences;
  }

  /**
   * Get match scores for compared profiles
   */
  async getComparisonWithMatchScores(userId: string, profileIds: string[]) {
    const comparison = await this.compareProfiles(userId, profileIds);

    // Get match scores for each profile
    const matchScores = await Promise.all(
      profileIds.map(async (profileId) => {
        try {
          const { MatchingService } = await import('../matching/matching.service');
          const matchingService = new MatchingService(this.prisma);
          const score = await matchingService.calculateMatchScore(userId, profileId);
          return {
            profileId,
            matchScore: score.overallScore,
            scores: score.scores,
            matchReasons: score.matchReasons,
            isReverseMatch: score.isReverseMatch,
          };
        } catch (error) {
          return {
            profileId,
            matchScore: 0,
            scores: null,
            matchReasons: [],
            isReverseMatch: false,
          };
        }
      }),
    );

    return {
      ...comparison,
      matchScores,
    };
  }

  /**
   * Get saved comparisons
   */
  async getSavedComparisons(userId: string) {
    return (this.prisma as any).profileComparison.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      include: {
        profile: {
          include: {
            photos: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete comparison
   */
  async deleteComparison(userId: string, profileId: string) {
    return (this.prisma as any).profileComparison.deleteMany({
      where: {
        userId,
        profileId,
      },
    });
  }
}

