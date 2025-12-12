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
exports.FeaturesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const gamification_service_1 = require("../gamification/gamification.service");
let FeaturesService = class FeaturesService {
    constructor(prisma, gamificationService) {
        this.prisma = prisma;
        this.gamificationService = gamificationService;
    }
    async checkDailyLoginReward(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return null;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastLoginDate = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
        if (lastLoginDate) {
            lastLoginDate.setHours(0, 0, 0, 0);
        }
        if (lastLoginDate && lastLoginDate.getTime() === today.getTime()) {
            return { alreadyRewarded: true, streak: user.loginStreak };
        }
        let newStreak = 1;
        if (lastLoginDate) {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            if (lastLoginDate.getTime() === yesterday.getTime()) {
                newStreak = user.loginStreak + 1;
            }
        }
        let pointsAwarded = 10;
        if (newStreak >= 7)
            pointsAwarded = 50;
        if (newStreak >= 30)
            pointsAwarded = 200;
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                lastLoginDate: today,
                loginStreak: newStreak,
                points: { increment: pointsAwarded },
            },
        });
        await this.createActivity(userId, 'DAILY_LOGIN', `Daily login reward - ${pointsAwarded} points`, `Streak: ${newStreak} days`, {
            streak: newStreak,
            pointsAwarded,
        });
        return {
            pointsAwarded,
            streak: newStreak,
            message: `You earned ${pointsAwarded} points! Streak: ${newStreak} days`,
        };
    }
    async createActivity(userId, type, title, description, metadata) {
        return this.prisma.activity.create({
            data: {
                userId,
                type,
                title,
                description,
                metadata: metadata || {},
            },
        });
    }
    async getActivityFeed(userId, limit = 20) {
        return this.prisma.activity.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async getLeaderboard(category, period = 'WEEKLY', limit = 100) {
        const now = new Date();
        let periodStart;
        switch (period) {
            case 'DAILY':
                periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'WEEKLY':
                const dayOfWeek = now.getDay();
                periodStart = new Date(now);
                periodStart.setDate(now.getDate() - dayOfWeek);
                periodStart.setHours(0, 0, 0, 0);
                break;
            case 'MONTHLY':
                periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                periodStart = new Date(0);
        }
        return this.prisma.leaderboard.findMany({
            where: {
                category,
                period,
                periodStart: { gte: periodStart },
            },
            include: {
                user: {
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
            orderBy: { rank: 'asc' },
            take: limit,
        });
    }
    async updateLeaderboard(userId, category, score) {
        const period = 'WEEKLY';
        const now = new Date();
        const dayOfWeek = now.getDay();
        const periodStart = new Date(now);
        periodStart.setDate(now.getDate() - dayOfWeek);
        periodStart.setHours(0, 0, 0, 0);
        const allScores = await this.prisma.leaderboard.findMany({
            where: {
                category,
                period,
                periodStart: { gte: periodStart },
            },
            orderBy: { score: 'desc' },
        });
        const rank = allScores.findIndex((s) => s.score < score) + 1 || allScores.length + 1;
        await this.prisma.leaderboard.upsert({
            where: {
                userId_category_period_periodStart: {
                    userId,
                    category,
                    period,
                    periodStart,
                },
            },
            create: {
                userId,
                category,
                period,
                periodStart,
                rank,
                score,
            },
            update: {
                rank,
                score,
            },
        });
        const updatedScores = await this.prisma.leaderboard.findMany({
            where: {
                category,
                period,
                periodStart: { gte: periodStart },
            },
            orderBy: { score: 'desc' },
        });
        for (let i = 0; i < updatedScores.length; i++) {
            await this.prisma.leaderboard.update({
                where: { id: updatedScores[i].id },
                data: { rank: i + 1 },
            });
        }
    }
};
exports.FeaturesService = FeaturesService;
exports.FeaturesService = FeaturesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gamification_service_1.GamificationService])
], FeaturesService);
//# sourceMappingURL=features.service.js.map