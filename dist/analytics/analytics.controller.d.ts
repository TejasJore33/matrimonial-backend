import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private analyticsService;
    constructor(analyticsService: AnalyticsService);
    getUserAnalytics(user: any, period?: '7d' | '30d' | '90d' | 'all'): Promise<{
        trends: {
            interestsSent: any;
            interestsReceived: any;
            profileViews: any;
            matches: any;
            messages: any;
        };
        insights: string[];
    } | {
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
    getDetailedAnalytics(user: any, period?: '7d' | '30d' | '90d' | 'all'): Promise<{
        trends: {
            interestsSent: any;
            interestsReceived: any;
            profileViews: any;
            matches: any;
            messages: any;
        };
        insights: string[];
    }>;
}
