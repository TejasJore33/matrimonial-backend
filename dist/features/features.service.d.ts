import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
export declare class FeaturesService {
    private prisma;
    private gamificationService;
    constructor(prisma: PrismaService, gamificationService: GamificationService);
    checkDailyLoginReward(userId: string): Promise<{
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
    createActivity(userId: string, type: string, title: string, description?: string, metadata?: any): Promise<{
        type: string;
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getActivityFeed(userId: string, limit?: number): Promise<any>;
    getLeaderboard(category: string, period?: string, limit?: number): Promise<any>;
    updateLeaderboard(userId: string, category: string, score: number): Promise<void>;
}
