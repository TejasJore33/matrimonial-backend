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
exports.GamificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let GamificationService = class GamificationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkAndAwardAchievements(userId, action) {
        const achievements = {
            PROFILE_COMPLETE: {
                type: 'PROFILE_COMPLETE',
                title: 'Profile Complete',
                description: 'You completed your profile!',
                points: 50,
            },
            FIRST_INTEREST: {
                type: 'FIRST_INTEREST',
                title: 'First Interest',
                description: 'You sent your first interest!',
                points: 10,
            },
            FIRST_MATCH: {
                type: 'FIRST_MATCH',
                title: 'First Match',
                description: 'You got your first match!',
                points: 25,
            },
            FIRST_MESSAGE: {
                type: 'FIRST_MESSAGE',
                title: 'First Message',
                description: 'You sent your first message!',
                points: 15,
            },
            PROFILE_VERIFIED: {
                type: 'PROFILE_VERIFIED',
                title: 'Verified Profile',
                description: 'Your profile is verified!',
                points: 30,
            },
            PHOTO_UPLOADED: {
                type: 'PHOTO_UPLOADED',
                title: 'Photo Uploaded',
                description: 'You uploaded your first photo!',
                points: 5,
            },
        };
        const achievement = achievements[action];
        if (!achievement) {
            return null;
        }
        const existing = await this.prisma.achievement.findFirst({
            where: {
                userId,
                type: achievement.type,
            },
        });
        if (existing) {
            return null;
        }
        await this.prisma.achievement.create({
            data: {
                userId,
                type: achievement.type,
                title: achievement.title,
                description: achievement.description,
                points: achievement.points,
            },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                points: {
                    increment: achievement.points,
                },
            },
        });
        return achievement;
    }
    async getUserAchievements(userId) {
        const achievements = await this.prisma.achievement.findMany({
            where: { userId },
            orderBy: { unlockedAt: 'desc' },
        });
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { points: true },
        });
        return {
            achievements,
            totalPoints: user?.points || 0,
            achievementCount: achievements.length,
        };
    }
    async getLeaderboard(limit = 10) {
        const users = await this.prisma.user.findMany({
            where: {
                points: { gt: 0 },
            },
            select: {
                id: true,
                email: true,
                points: true,
                profile: {
                    select: {
                        firstName: true,
                        lastName: true,
                        photos: {
                            where: { isPrimary: true },
                            take: 1,
                        },
                    },
                },
                achievements: {
                    take: 3,
                    orderBy: { unlockedAt: 'desc' },
                },
            },
            orderBy: { points: 'desc' },
            take: limit,
        });
        return users.map((user, index) => ({
            rank: index + 1,
            userId: user.id,
            name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email,
            points: user.points,
            photo: user.profile?.photos[0]?.url,
            achievements: user.achievements,
        }));
    }
    async getUserRank(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { points: true },
        });
        if (!user || user.points === 0) {
            return { rank: null, totalUsers: 0 };
        }
        const usersWithMorePoints = await this.prisma.user.count({
            where: {
                points: { gt: user.points },
            },
        });
        const totalUsers = await this.prisma.user.count({
            where: {
                points: { gt: 0 },
            },
        });
        return {
            rank: usersWithMorePoints + 1,
            totalUsers,
            points: user.points,
        };
    }
};
exports.GamificationService = GamificationService;
exports.GamificationService = GamificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GamificationService);
//# sourceMappingURL=gamification.service.js.map