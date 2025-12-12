import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchFiltersDto } from './dto/search.dto';
import { PAID_SUBSCRIPTION_PLANS } from '../common/constants/subscription.constants';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(userId: string, filters: SearchFiltersDto, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Build where clause - allow searching even without own profile
    const where: any = {
      status: { in: ['ACTIVE', 'PENDING_APPROVAL'] }, // Include both ACTIVE and PENDING_APPROVAL profiles
      userId: { not: userId }, // Exclude self
    };

    if (filters.gender) {
      where.gender = filters.gender;
    }

    if (filters.minAge || filters.maxAge) {
      const now = new Date();
      if (filters.maxAge) {
        const minDate = new Date(now.getFullYear() - filters.maxAge - 1, now.getMonth(), now.getDate());
        where.dateOfBirth = { ...where.dateOfBirth, gte: minDate };
      }
      if (filters.minAge) {
        const maxDate = new Date(now.getFullYear() - filters.minAge, now.getMonth(), now.getDate());
        where.dateOfBirth = { ...where.dateOfBirth, lte: maxDate };
      }
    }

    if (filters.minHeight || filters.maxHeight) {
      where.height = {};
      if (filters.minHeight) where.height.gte = filters.minHeight;
      if (filters.maxHeight) where.height.lte = filters.maxHeight;
    }

    // Support multiple religions
    if (filters.religion) {
      if (Array.isArray(filters.religion)) {
        where.religion = { in: filters.religion };
      } else {
        where.religion = filters.religion;
      }
    }

    // Support multiple castes
    if (filters.caste) {
      if (Array.isArray(filters.caste)) {
        where.caste = { in: filters.caste };
      } else {
        where.caste = filters.caste;
      }
    }

    // Support multiple mother tongues
    if (filters.motherTongue) {
      if (Array.isArray(filters.motherTongue)) {
        where.motherTongue = { in: filters.motherTongue };
      } else {
        where.motherTongue = filters.motherTongue;
      }
    }

    // Support multiple cities
    if (filters.cities && Array.isArray(filters.cities) && filters.cities.length > 0) {
      where.city = { in: filters.cities };
    }

    // Support multiple states
    if (filters.states && Array.isArray(filters.states) && filters.states.length > 0) {
      where.state = { in: filters.states };
    }

    // Support multiple countries
    if (filters.countries && Array.isArray(filters.countries) && filters.countries.length > 0) {
      where.country = { in: filters.countries };
    }

    // Support multiple education levels
    if (filters.educations && Array.isArray(filters.educations) && filters.educations.length > 0) {
      where.education = { in: filters.educations };
    }

    // Support multiple occupations
    if (filters.occupations && Array.isArray(filters.occupations) && filters.occupations.length > 0) {
      where.occupation = { in: filters.occupations };
    }

    // Support multiple marital statuses
    if (filters.maritalStatuses && Array.isArray(filters.maritalStatuses) && filters.maritalStatuses.length > 0) {
      where.maritalStatus = { in: filters.maritalStatuses };
    }

    // Support multiple family types
    if (filters.familyTypes && Array.isArray(filters.familyTypes) && filters.familyTypes.length > 0) {
      where.familyType = { in: filters.familyTypes };
    }

    // Support multiple diets
    if (filters.diets && Array.isArray(filters.diets) && filters.diets.length > 0) {
      where.diet = { in: filters.diets };
    }

    // Working abroad filter
    if (filters.workingAbroad !== undefined) {
      if (filters.workingAbroad) {
        where.country = { not: 'India' };
      } else {
        where.country = 'India';
      }
    }

    // NRI filter
    if (filters.nri !== undefined) {
      if (filters.nri) {
        where.citizenship = { not: 'Indian' };
      } else {
        where.citizenship = 'Indian';
      }
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters.state) {
      where.state = { contains: filters.state, mode: 'insensitive' };
    }

    if (filters.education) {
      where.education = { contains: filters.education, mode: 'insensitive' };
    }

    if (filters.minIncome) {
      where.income = { ...where.income, gte: filters.minIncome };
    }

    if (filters.manglik !== undefined) {
      where.manglik = filters.manglik;
    }

    if (filters.smoking !== undefined) {
      where.smoking = filters.smoking;
    }

    if (filters.drinking !== undefined) {
      where.drinking = filters.drinking;
    }

    if (filters.withPhoto) {
      where.photos = { some: { isApproved: true } };
    }

    if (filters.verifiedOnly) {
      where.isVerified = true;
    }

    // Exclude hidden profiles
    where.isHiddenFromSearch = false;

    // Get profiles
    const [profiles, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        include: {
          photos: {
            where: { isApproved: true },
            orderBy: { order: 'asc' },
            take: 1,
          },
          user: {
            select: {
              id: true,
              isEmailVerified: true,
              isMobileVerified: true,
              isOnline: true,
              lastActiveAt: true,
              subscriptions: {
                where: {
                  status: 'ACTIVE',
                  endDate: { gt: new Date() },
                },
                select: {
                  id: true,
                  plan: true,
                  status: true,
                  endDate: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.profile.count({ where }),
    ]);

    return {
      results: profiles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Search with advanced sorting
   */
  async searchWithSort(
    userId: string,
    filters: SearchFiltersDto,
    sortBy: string = 'relevance',
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {
      status: { in: ['ACTIVE', 'PENDING_APPROVAL'] },
      userId: { not: userId },
      isHiddenFromSearch: false,
    };

    // Apply filters (same as search method)
    // ... (copy filter logic from search method)

    let orderBy: any = { createdAt: 'desc' };

    switch (sortBy) {
      case 'recent':
        orderBy = { createdAt: 'desc' };
        break;
      case 'match_score':
        // Will need to join with MatchScore table
        orderBy = { createdAt: 'desc' }; // Placeholder
        break;
      case 'distance':
        // Will need to calculate distance
        orderBy = { createdAt: 'desc' }; // Placeholder
        break;
      case 'most_viewed':
        // Will need to join with ProfileView
        orderBy = { createdAt: 'desc' }; // Placeholder
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [profiles, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        include: {
          photos: {
            where: { isApproved: true },
            orderBy: { order: 'asc' },
            take: 1,
          },
          user: {
            select: {
              id: true,
              email: true,
              mobile: true,
              isOnline: true,
              lastActiveAt: true,
              subscriptions: {
                where: {
                  status: 'ACTIVE',
                  endDate: { gt: new Date() },
                },
                select: {
                  id: true,
                  plan: true,
                  status: true,
                  endDate: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.profile.count({ where }),
    ]);

    return { profiles, total, page, limit };
  }

  /**
   * Filter by activity status
   */
  async searchByActivity(
    userId: string,
    filters: SearchFiltersDto,
    activityFilter: 'active_7d' | 'active_30d' | 'recently_updated' | 'online_now',
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {
      status: { in: ['ACTIVE', 'PENDING_APPROVAL'] },
      userId: { not: userId },
      isHiddenFromSearch: false,
    };

    // Apply activity filter
    if (activityFilter === 'active_7d') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      where.user = {
        lastActiveAt: { gte: sevenDaysAgo },
      };
    } else if (activityFilter === 'active_30d') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.user = {
        lastActiveAt: { gte: thirtyDaysAgo },
      };
    } else if (activityFilter === 'recently_updated') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      where.updatedAt = { gte: sevenDaysAgo };
    } else if (activityFilter === 'online_now') {
      where.user = {
        isOnline: true,
      };
    }

    // Apply other filters
    // ... (copy filter logic)

    const [profiles, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        include: {
          photos: {
            where: { isApproved: true },
            orderBy: { order: 'asc' },
            take: 1,
          },
          user: {
            select: {
              id: true,
              email: true,
              mobile: true,
              isOnline: true,
              lastActiveAt: true,
              subscriptions: {
                where: {
                  status: 'ACTIVE',
                  endDate: { gt: new Date() },
                },
                select: {
                  id: true,
                  plan: true,
                  status: true,
                  endDate: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.profile.count({ where }),
    ]);

    return { profiles, total, page, limit };
  }

  async getDailyMatches(userId: string, limit: number = 20) {
    const userProfile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (!userProfile) {
      return [];
    }

    // Get partner preferences
    const preferences = userProfile.partnerPreferences as any || {};

    // Build match criteria based on preferences
    const where: any = {
      status: 'ACTIVE',
      userId: { not: userId },
    };

    if (preferences.gender) {
      where.gender = preferences.gender;
    }

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

    if (preferences.religion) {
      where.religion = preferences.religion;
    }

    if (preferences.city) {
      where.city = { contains: preferences.city, mode: 'insensitive' };
    }

    // Get profiles not yet interacted with
    const sentInterests = await this.prisma.interest.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true },
    });

    const excludedUserIds = sentInterests.map(i => i.toUserId);
    if (excludedUserIds.length > 0) {
      where.userId = { notIn: excludedUserIds };
    }

    const matches = await this.prisma.profile.findMany({
      where,
      include: {
        photos: {
          where: { isApproved: true },
          orderBy: { order: 'asc' },
          take: 1,
        },
        user: {
          select: {
            id: true,
            isEmailVerified: true,
            isMobileVerified: true,
            isOnline: true,
            lastActiveAt: true,
            subscriptions: {
              where: {
                status: 'ACTIVE',
                endDate: { gt: new Date() },
              },
              select: {
                id: true,
                plan: true,
                status: true,
                endDate: true,
              },
            },
          },
        },
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    return matches;
  }

  async saveSearch(userId: string, name: string, filters: any) {
    return this.prisma.savedSearch.create({
      data: {
        userId,
        name,
        filters,
      },
    });
  }

  async getSavedSearches(userId: string) {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async deleteSavedSearch(userId: string, searchId: string) {
    return this.prisma.savedSearch.delete({
      where: {
        id: searchId,
        userId,
      },
    });
  }

  /**
   * Save search history
   */
  async saveSearchHistory(userId: string, profileId: string | undefined, filters: any) {
    return this.prisma.searchHistory.create({
      data: {
        userId,
        profileId: profileId || null,
        searchQuery: null,
        filters: filters || {},
      },
    });
  }

  /**
   * Get recently joined profiles
   */
  async getRecentlyJoined(userId: string, limit: number = 20) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return this.prisma.profile.findMany({
      where: {
        status: 'ACTIVE',
        userId: { not: userId },
        createdAt: { gte: sevenDaysAgo },
        isHiddenFromSearch: false,
      },
      include: {
        photos: {
          where: { isApproved: true },
          orderBy: { order: 'asc' },
          take: 1,
        },
        user: {
          select: {
            id: true,
            isEmailVerified: true,
            isMobileVerified: true,
            isOnline: true,
            lastActiveAt: true,
            subscriptions: {
              where: {
                status: 'ACTIVE',
                endDate: { gt: new Date() },
              },
              select: {
                id: true,
                plan: true,
                status: true,
                endDate: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get premium profiles
   */
  async getPremiumProfiles(userId: string, limit: number = 20) {
    const premiumUsers = await this.prisma.user.findMany({
      where: {
        subscriptions: {
          some: {
            status: 'ACTIVE',
            endDate: { gt: new Date() },
            plan: { in:[...PAID_SUBSCRIPTION_PLANS]  },
          },
        },
      },
      select: { id: true },
    });

    const premiumUserIds = premiumUsers.map((u) => u.id);

    return this.prisma.profile.findMany({
      where: {
        status: 'ACTIVE',
        userId: { in: premiumUserIds, not: userId },
        isHiddenFromSearch: false,
      },
      include: {
        photos: {
          where: { isApproved: true },
          orderBy: { order: 'asc' },
          take: 1,
        },
        user: {
          select: {
            id: true,
            isEmailVerified: true,
            isMobileVerified: true,
            isOnline: true,
            lastActiveAt: true,
            subscriptions: {
              where: {
                status: 'ACTIVE',
                endDate: { gt: new Date() },
              },
              select: {
                id: true,
                plan: true,
                status: true,
                endDate: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get search history
   */
  async getSearchHistory(userId: string, limit: number = 20) {
    return this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

