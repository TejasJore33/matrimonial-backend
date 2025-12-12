import { GamificationService } from './gamification.service';
export declare class GamificationController {
    private gamificationService;
    constructor(gamificationService: GamificationService);
    getUserAchievements(user: any): Promise<{
        achievements: {
            type: string;
            id: string;
            points: number;
            userId: string;
            title: string;
            description: string | null;
            icon: string | null;
            unlockedAt: Date;
        }[];
        totalPoints: number;
        achievementCount: number;
    }>;
    getLeaderboard(limit?: string): Promise<{
        rank: number;
        userId: string;
        name: string;
        points: number;
        photo: string;
        achievements: {
            type: string;
            id: string;
            points: number;
            userId: string;
            title: string;
            description: string | null;
            icon: string | null;
            unlockedAt: Date;
        }[];
    }[]>;
    getUserRank(user: any): Promise<{
        rank: any;
        totalUsers: number;
        points?: undefined;
    } | {
        rank: number;
        totalUsers: number;
        points: number;
    }>;
}
