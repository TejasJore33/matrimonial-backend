import { FeaturesService } from './features.service';
export declare class FeaturesController {
    private featuresService;
    constructor(featuresService: FeaturesService);
    checkDailyLoginReward(user: any): Promise<{
        alreadyRewarded: boolean;
        streak: number;
        pointsAwarded?: undefined;
        message?: undefined;
    } | {
        pointsAwarded: number;
        streak: number;
        message: string;
        alreadyRewarded?: undefined;
    }>;
    getActivityFeed(user: any, limit?: string): Promise<any>;
    getLeaderboard(category?: string, period?: string, limit?: string): Promise<any>;
}
