import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getUserAnalytics(userId: string): Promise<{
        overview: {
            profileCompleteness: number;
            isVerified: boolean;
            profileStatus: import(".prisma/client").$Enums.ProfileStatus;
            daysActive: number;
        };
        interests: {
            sent: number;
            received: number;
            accepted: number;
            responseRate: number;
        };
        engagement: {
            profileViews: number;
            matches: number;
            chats: number;
            messages: number;
            shortlists: number;
        };
        performance: {
            score: number;
            recommendations: string[];
        };
    }>;
    private calculatePerformanceScore;
    private getRecommendations;
    getDetailedAnalytics(userId: string, period?: '7d' | '30d' | '90d' | 'all'): Promise<{
        trends: {
            interestsSent: any;
            interestsReceived: any;
            profileViews: any;
            matches: any;
            messages: any;
        };
        insights: string[];
    }>;
    private getInterestsTrend;
    private getProfileViewsTrend;
    private getMatchesTrend;
    private getMessagesTrend;
    private generateInsights;
}
