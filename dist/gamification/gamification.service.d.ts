import { PrismaService } from '../prisma/prisma.service';
export declare class GamificationService {
    private prisma;
    constructor(prisma: PrismaService);
    checkAndAwardAchievements(userId: string, action: string): Promise<{
        type: string;
        title: string;
        description: string;
        points: number;
    }>;
    getUserAchievements(userId: string): Promise<{
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
    getLeaderboard(limit?: number): Promise<{
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
    getUserRank(userId: string): Promise<{
        rank: any;
        totalUsers: number;
        points?: undefined;
    } | {
        rank: number;
        totalUsers: number;
        points: number;
    }>;
}
