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
exports.MatchingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MatchingService = class MatchingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async calculateMatchScore(userId, matchedUserId) {
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
            throw new common_1.NotFoundException('Profile not found');
        }
        const scores = {
            religion: this.calculateReligionScore(userProfile, matchedProfile),
            education: this.calculateEducationScore(userProfile, matchedProfile),
            lifestyle: this.calculateLifestyleScore(userProfile, matchedProfile),
            location: this.calculateLocationScore(userProfile, matchedProfile),
            family: this.calculateFamilyScore(userProfile, matchedProfile),
        };
        const overallScore = Math.round((scores.religion * 0.25 +
            scores.education * 0.20 +
            scores.lifestyle * 0.20 +
            scores.location * 0.15 +
            scores.family * 0.20));
        const matchReasons = this.generateMatchReasons(userProfile, matchedProfile, scores);
        const isReverseMatch = await this.checkReverseMatch(userId, matchedUserId, matchedProfile);
        await this.prisma.matchScore.upsert({
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
    calculateReligionScore(profile1, profile2) {
        let score = 0;
        if (profile1.religion && profile2.religion) {
            if (profile1.religion === profile2.religion)
                score += 40;
            else
                score += 10;
        }
        if (profile1.caste && profile2.caste) {
            if (profile1.caste === profile2.caste)
                score += 30;
            else
                score += 5;
        }
        if (profile1.motherTongue && profile2.motherTongue) {
            if (profile1.motherTongue === profile2.motherTongue)
                score += 20;
            else
                score += 5;
        }
        if (profile1.manglik !== undefined && profile2.manglik !== undefined) {
            if (profile1.manglik === profile2.manglik)
                score += 10;
        }
        return Math.min(100, score);
    }
    calculateEducationScore(profile1, profile2) {
        let score = 50;
        if (profile1.education && profile2.education) {
            const edu1 = profile1.education.toLowerCase();
            const edu2 = profile2.education.toLowerCase();
            if (edu1 === edu2) {
                score = 100;
            }
            else {
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
    calculateLifestyleScore(profile1, profile2) {
        let score = 0;
        if (profile1.diet && profile2.diet) {
            if (profile1.diet === profile2.diet)
                score += 30;
            else if ((profile1.diet === 'VEGETARIAN' && profile2.diet === 'EGGETARIAN') ||
                (profile1.diet === 'EGGETARIAN' && profile2.diet === 'VEGETARIAN')) {
                score += 20;
            }
            else {
                score += 5;
            }
        }
        if (profile1.smoking !== undefined && profile2.smoking !== undefined) {
            if (profile1.smoking === profile2.smoking)
                score += 25;
            else
                score += 5;
        }
        if (profile1.drinking !== undefined && profile2.drinking !== undefined) {
            if (profile1.drinking === profile2.drinking)
                score += 25;
            else
                score += 5;
        }
        if (profile1.hobbies && profile2.hobbies) {
            try {
                const hobbies1 = JSON.parse(profile1.hobbies);
                const hobbies2 = JSON.parse(profile2.hobbies);
                if (Array.isArray(hobbies1) && Array.isArray(hobbies2)) {
                    const commonHobbies = hobbies1.filter((h) => hobbies2.includes(h));
                    if (commonHobbies.length > 0) {
                        score += Math.min(20, commonHobbies.length * 5);
                    }
                }
            }
            catch (e) {
            }
        }
        return Math.min(100, score);
    }
    calculateLocationScore(profile1, profile2) {
        let score = 0;
        if (profile1.city && profile2.city && profile1.city === profile2.city) {
            score += 50;
        }
        if (profile1.state && profile2.state && profile1.state === profile2.state) {
            score += 30;
        }
        if (profile1.country && profile2.country && profile1.country === profile2.country) {
            score += 20;
        }
        if (profile1.latitude && profile1.longitude && profile2.latitude && profile2.longitude) {
            const distance = this.calculateDistance(profile1.latitude, profile1.longitude, profile2.latitude, profile2.longitude);
            if (distance < 50) {
                score += Math.max(0, 50 - distance);
            }
        }
        return Math.min(100, score);
    }
    calculateFamilyScore(profile1, profile2) {
        let score = 50;
        if (profile1.familyType && profile2.familyType) {
            if (profile1.familyType === profile2.familyType)
                score += 30;
            else
                score += 10;
        }
        if (profile1.fatherOccupation && profile2.fatherOccupation) {
            if (profile1.fatherOccupation === profile2.fatherOccupation)
                score += 20;
        }
        return Math.min(100, score);
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRad(degrees) {
        return (degrees * Math.PI) / 180;
    }
    generateMatchReasons(profile1, profile2, scores) {
        const reasons = [];
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
    async checkReverseMatch(userId, matchedUserId, matchedProfile) {
        const userProfile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!userProfile || !userProfile.partnerPreferences) {
            return false;
        }
        try {
            const preferences = userProfile.partnerPreferences;
            if (preferences.gender && matchedProfile.gender !== preferences.gender) {
                return false;
            }
            if (preferences.religion && matchedProfile.religion !== preferences.religion) {
                return false;
            }
            if (preferences.minAge || preferences.maxAge) {
                const age = this.calculateAge(matchedProfile.dateOfBirth);
                if (preferences.minAge && age < preferences.minAge)
                    return false;
                if (preferences.maxAge && age > preferences.maxAge)
                    return false;
            }
            return true;
        }
        catch (e) {
            return false;
        }
    }
    calculateAge(dateOfBirth) {
        if (!dateOfBirth)
            return 0;
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    async getUserMatchScores(userId, limit = 20) {
        return this.prisma.matchScore.findMany({
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
    async getReverseMatches(userId, limit = 20) {
        const userProfile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!userProfile || !userProfile.partnerPreferences) {
            return [];
        }
        const preferences = userProfile.partnerPreferences;
        const where = {
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
        const matches = await Promise.all(profiles.map(async (profile) => {
            const matchScore = await this.calculateMatchScore(userId, profile.userId);
            return {
                profile,
                matchScore: matchScore.overallScore,
                isReverseMatch: true,
            };
        }));
        return matches.sort((a, b) => b.matchScore - a.matchScore);
    }
};
exports.MatchingService = MatchingService;
exports.MatchingService = MatchingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MatchingService);
//# sourceMappingURL=matching.service.js.map