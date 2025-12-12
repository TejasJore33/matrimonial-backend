"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const subscription_constants_1 = require("../common/constants/subscription.constants");
let SearchService = class SearchService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async search(userId, filters, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = {
            status: { in: ['ACTIVE', 'PENDING_APPROVAL'] },
            userId: { not: userId },
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
            if (filters.minHeight)
                where.height.gte = filters.minHeight;
            if (filters.maxHeight)
                where.height.lte = filters.maxHeight;
        }
        if (filters.religion) {
            if (Array.isArray(filters.religion)) {
                where.religion = { in: filters.religion };
            }
            else {
                where.religion = filters.religion;
            }
        }
        if (filters.caste) {
            if (Array.isArray(filters.caste)) {
                where.caste = { in: filters.caste };
            }
            else {
                where.caste = filters.caste;
            }
        }
        if (filters.motherTongue) {
            if (Array.isArray(filters.motherTongue)) {
                where.motherTongue = { in: filters.motherTongue };
            }
            else {
                where.motherTongue = filters.motherTongue;
            }
        }
        if (filters.cities && Array.isArray(filters.cities) && filters.cities.length > 0) {
            where.city = { in: filters.cities };
        }
        if (filters.states && Array.isArray(filters.states) && filters.states.length > 0) {
            where.state = { in: filters.states };
        }
        if (filters.countries && Array.isArray(filters.countries) && filters.countries.length > 0) {
            where.country = { in: filters.countries };
        }
        if (filters.educations && Array.isArray(filters.educations) && filters.educations.length > 0) {
            where.education = { in: filters.educations };
        }
        if (filters.occupations && Array.isArray(filters.occupations) && filters.occupations.length > 0) {
            where.occupation = { in: filters.occupations };
        }
        if (filters.maritalStatuses && Array.isArray(filters.maritalStatuses) && filters.maritalStatuses.length > 0) {
            where.maritalStatus = { in: filters.maritalStatuses };
        }
        if (filters.familyTypes && Array.isArray(filters.familyTypes) && filters.familyTypes.length > 0) {
            where.familyType = { in: filters.familyTypes };
        }
        if (filters.diets && Array.isArray(filters.diets) && filters.diets.length > 0) {
            where.diet = { in: filters.diets };
        }
        if (filters.workingAbroad !== undefined) {
            if (filters.workingAbroad) {
                where.country = { not: 'India' };
            }
            else {
                where.country = 'India';
            }
        }
        if (filters.nri !== undefined) {
            if (filters.nri) {
                where.citizenship = { not: 'Indian' };
            }
            else {
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
        where.isHiddenFromSearch = false;
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
    async searchWithSort(userId, filters, sortBy = 'relevance', page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = {
            status: { in: ['ACTIVE', 'PENDING_APPROVAL'] },
            userId: { not: userId },
            isHiddenFromSearch: false,
        };
        let orderBy = { createdAt: 'desc' };
        switch (sortBy) {
            case 'recent':
                orderBy = { createdAt: 'desc' };
                break;
            case 'match_score':
                orderBy = { createdAt: 'desc' };
                break;
            case 'distance':
                orderBy = { createdAt: 'desc' };
                break;
            case 'most_viewed':
                orderBy = { createdAt: 'desc' };
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
    async searchByActivity(userId, filters, activityFilter, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = {
            status: { in: ['ACTIVE', 'PENDING_APPROVAL'] },
            userId: { not: userId },
            isHiddenFromSearch: false,
        };
        if (activityFilter === 'active_7d') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            where.user = {
                lastActiveAt: { gte: sevenDaysAgo },
            };
        }
        else if (activityFilter === 'active_30d') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            where.user = {
                lastActiveAt: { gte: thirtyDaysAgo },
            };
        }
        else if (activityFilter === 'recently_updated') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            where.updatedAt = { gte: sevenDaysAgo };
        }
        else if (activityFilter === 'online_now') {
            where.user = {
                isOnline: true,
            };
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
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.profile.count({ where }),
        ]);
        return { profiles, total, page, limit };
    }
    async getDailyMatches(userId, limit = 20) {
        const userProfile = await this.prisma.profile.findUnique({
            where: { userId },
            include: {
                user: true,
            },
        });
        if (!userProfile) {
            return [];
        }
        const preferences = userProfile.partnerPreferences || {};
        const where = {
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
    async saveSearch(userId, name, filters) {
        return this.prisma.savedSearch.create({
            data: {
                userId,
                name,
                filters,
            },
        });
    }
    async getSavedSearches(userId) {
        return this.prisma.savedSearch.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async deleteSavedSearch(userId, searchId) {
        return this.prisma.savedSearch.delete({
            where: {
                id: searchId,
                userId,
            },
        });
    }
    async saveSearchHistory(userId, profileId, filters) {
        return this.prisma.searchHistory.create({
            data: {
                userId,
                profileId: profileId || null,
                searchQuery: null,
                filters: filters || {},
            },
        });
    }
    async getRecentlyJoined(userId, limit = 20) {
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
    async getPremiumProfiles(userId, limit = 20) {
        const premiumUsers = await this.prisma.user.findMany({
            where: {
                subscriptions: {
                    some: {
                        status: 'ACTIVE',
                        endDate: { gt: new Date() },
                        plan: { in: [...subscription_constants_1.PAID_SUBSCRIPTION_PLANS] },
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
    async getSearchHistory(userId, limit = 20) {
        return this.prisma.searchHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchService);
//# sourceMappingURL=search.service.js.map