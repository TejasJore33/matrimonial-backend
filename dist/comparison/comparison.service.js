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
exports.ComparisonService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ComparisonService = class ComparisonService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async compareProfiles(userId, profileIds) {
        if (profileIds.length < 2 || profileIds.length > 3) {
            throw new common_1.BadRequestException('Can compare 2-3 profiles at a time');
        }
        const profiles = await Promise.all(profileIds.map(id => this.prisma.profile.findUnique({
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
        })));
        if (profiles.some(p => !p)) {
            throw new common_1.NotFoundException('One or more profiles not found');
        }
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
        for (const profileId of profileIds) {
            await this.prisma.profileComparison.upsert({
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
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
    async getComparisonHistory(userId) {
        return this.prisma.profileComparison.findMany({
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
    calculateAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    findDifferences(profiles) {
        const differences = {};
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
    async getComparisonWithMatchScores(userId, profileIds) {
        const comparison = await this.compareProfiles(userId, profileIds);
        const matchScores = await Promise.all(profileIds.map(async (profileId) => {
            try {
                const { MatchingService } = await Promise.resolve().then(() => __importStar(require('../matching/matching.service')));
                const matchingService = new MatchingService(this.prisma);
                const score = await matchingService.calculateMatchScore(userId, profileId);
                return {
                    profileId,
                    matchScore: score.overallScore,
                    scores: score.scores,
                    matchReasons: score.matchReasons,
                    isReverseMatch: score.isReverseMatch,
                };
            }
            catch (error) {
                return {
                    profileId,
                    matchScore: 0,
                    scores: null,
                    matchReasons: [],
                    isReverseMatch: false,
                };
            }
        }));
        return {
            ...comparison,
            matchScores,
        };
    }
    async getSavedComparisons(userId) {
        return this.prisma.profileComparison.findMany({
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
    async deleteComparison(userId, profileId) {
        return this.prisma.profileComparison.deleteMany({
            where: {
                userId,
                profileId,
            },
        });
    }
};
exports.ComparisonService = ComparisonService;
exports.ComparisonService = ComparisonService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ComparisonService);
//# sourceMappingURL=comparison.service.js.map