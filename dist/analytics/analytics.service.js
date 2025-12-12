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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserAnalytics(userId) {
        const [profile, interestsSent, interestsReceived, interestsAccepted, profileViews, matches, chats, messages, shortlists,] = await Promise.all([
            this.prisma.profile.findUnique({
                where: { userId },
                select: {
                    completenessScore: true,
                    isVerified: true,
                    status: true,
                    createdAt: true,
                },
            }),
            this.prisma.interest.count({ where: { fromUserId: userId } }),
            this.prisma.interest.count({ where: { toUserId: userId } }),
            this.prisma.interest.count({
                where: {
                    OR: [
                        { fromUserId: userId, status: 'ACCEPTED' },
                        { toUserId: userId, status: 'ACCEPTED' },
                    ],
                },
            }),
            this.prisma.profileView.count({
                where: {
                    profile: { userId },
                },
            }),
            this.prisma.interest.count({
                where: {
                    OR: [
                        { fromUserId: userId, status: 'ACCEPTED' },
                        { toUserId: userId, status: 'ACCEPTED' },
                    ],
                },
            }),
            this.prisma.chat.count({
                where: {
                    OR: [
                        { user1Id: userId },
                        { user2Id: userId },
                    ],
                },
            }),
            this.prisma.message.count({
                where: {
                    senderId: userId,
                },
            }),
            this.prisma.shortlist.count({ where: { userId } }),
        ]);
        const responseRate = interestsReceived > 0
            ? Math.round((interestsAccepted / interestsReceived) * 100)
            : 0;
        const performanceScore = this.calculatePerformanceScore({
            profileViews,
            interestsReceived,
            interestsAccepted,
            matches,
            completenessScore: profile?.completenessScore || 0,
        });
        const recommendations = this.getRecommendations({
            profile,
            interestsSent,
            interestsReceived,
            interestsAccepted,
            profileViews,
            matches,
            responseRate,
        });
        return {
            overview: {
                profileCompleteness: profile?.completenessScore || 0,
                isVerified: profile?.isVerified || false,
                profileStatus: profile?.status,
                daysActive: profile?.createdAt
                    ? Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                    : 0,
            },
            interests: {
                sent: interestsSent,
                received: interestsReceived,
                accepted: interestsAccepted,
                responseRate,
            },
            engagement: {
                profileViews,
                matches,
                chats,
                messages,
                shortlists,
            },
            performance: {
                score: performanceScore,
                recommendations,
            },
        };
    }
    calculatePerformanceScore(metrics) {
        let score = 0;
        score += (metrics.completenessScore / 100) * 30;
        const viewScore = Math.min(metrics.profileViews / 10, 1) * 20;
        score += viewScore;
        const interestScore = Math.min(metrics.interestsReceived / 5, 1) * 20;
        score += interestScore;
        const acceptanceRate = metrics.interestsReceived > 0
            ? metrics.interestsAccepted / metrics.interestsReceived
            : 0;
        score += acceptanceRate * 15;
        const matchScore = Math.min(metrics.matches / 3, 1) * 15;
        score += matchScore;
        return Math.round(score);
    }
    getRecommendations(metrics) {
        const recommendations = [];
        if (metrics.profile?.completenessScore < 70) {
            recommendations.push('Complete your profile to get more matches');
        }
        if (metrics.profileViews < 5) {
            recommendations.push('Upload more photos to increase profile visibility');
        }
        if (metrics.responseRate < 30 && metrics.interestsReceived > 0) {
            recommendations.push('Respond to interests to improve your response rate');
        }
        if (metrics.interestsSent < 3) {
            recommendations.push('Send more interests to increase your chances of finding a match');
        }
        if (!metrics.profile?.isVerified) {
            recommendations.push('Verify your profile to build trust');
        }
        return recommendations;
    }
    async getDetailedAnalytics(userId, period = '30d') {
        const now = new Date();
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(0);
        }
        const [interestsSentTrend, interestsReceivedTrend, profileViewsTrend, matchesTrend, messagesTrend,] = await Promise.all([
            this.getInterestsTrend(userId, 'sent', startDate),
            this.getInterestsTrend(userId, 'received', startDate),
            this.getProfileViewsTrend(userId, startDate),
            this.getMatchesTrend(userId, startDate),
            this.getMessagesTrend(userId, startDate),
        ]);
        return {
            trends: {
                interestsSent: interestsSentTrend,
                interestsReceived: interestsReceivedTrend,
                profileViews: profileViewsTrend,
                matches: matchesTrend,
                messages: messagesTrend,
            },
            insights: this.generateInsights({
                interestsSentTrend,
                interestsReceivedTrend,
                profileViewsTrend,
                matchesTrend,
            }),
        };
    }
    async getInterestsTrend(userId, type, startDate) {
        const where = {
            createdAt: { gte: startDate },
        };
        if (type === 'sent') {
            where.fromUserId = userId;
        }
        else {
            where.toUserId = userId;
        }
        const interests = await this.prisma.interest.findMany({
            where,
            select: { createdAt: true, status: true },
        });
        const grouped = interests.reduce((acc, interest) => {
            const date = new Date(interest.createdAt).toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { total: 0, accepted: 0, rejected: 0, pending: 0 };
            }
            acc[date].total++;
            acc[date][interest.status.toLowerCase()]++;
            return acc;
        }, {});
        return grouped;
    }
    async getProfileViewsTrend(userId, startDate) {
        const views = await this.prisma.profileView.findMany({
            where: {
                profile: { userId },
                createdAt: { gte: startDate },
            },
            select: { createdAt: true },
        });
        const grouped = views.reduce((acc, view) => {
            const date = new Date(view.createdAt).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
        return grouped;
    }
    async getMatchesTrend(userId, startDate) {
        const matches = await this.prisma.interest.findMany({
            where: {
                OR: [
                    { fromUserId: userId, status: 'ACCEPTED', createdAt: { gte: startDate } },
                    { toUserId: userId, status: 'ACCEPTED', createdAt: { gte: startDate } },
                ],
            },
            select: { createdAt: true },
        });
        const grouped = matches.reduce((acc, match) => {
            const date = new Date(match.createdAt).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
        return grouped;
    }
    async getMessagesTrend(userId, startDate) {
        const messages = await this.prisma.message.findMany({
            where: {
                senderId: userId,
                createdAt: { gte: startDate },
            },
            select: { createdAt: true },
        });
        const grouped = messages.reduce((acc, message) => {
            const date = new Date(message.createdAt).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
        return grouped;
    }
    generateInsights(trends) {
        const insights = [];
        const sentCount = Object.values(trends.interestsSentTrend).reduce((sum, day) => sum + (day?.total || 0), 0);
        const receivedCount = Object.values(trends.interestsReceivedTrend).reduce((sum, day) => sum + (day?.total || 0), 0);
        if (sentCount > receivedCount * 2) {
            insights.push('You are sending more interests than receiving. Consider improving your profile to attract more attention.');
        }
        if (receivedCount > sentCount * 2) {
            insights.push('You are receiving many interests! Make sure to respond to show your engagement.');
        }
        const viewsCount = Object.values(trends.profileViewsTrend).reduce((sum, count) => sum + (count || 0), 0);
        if (viewsCount < 5) {
            insights.push('Your profile views are low. Try uploading more photos or updating your profile to increase visibility.');
        }
        return insights;
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map