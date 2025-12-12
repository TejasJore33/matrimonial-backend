import { PrismaService } from '../prisma/prisma.service';
export declare class ReferralService {
    private prisma;
    constructor(prisma: PrismaService);
    generateReferralCode(userId: string): Promise<string>;
    applyReferralCode(userId: string, referralCode: string): Promise<{
        message: string;
        referral: {
            id: string;
            createdAt: Date;
            status: string;
            rewardAmount: number | null;
            completedAt: Date | null;
            referrerId: string;
            referredId: string;
        };
        rewardPoints: number;
    }>;
    getReferralStats(userId: string): Promise<{
        referralCode: string;
        totalReferrals: number;
        completedReferrals: number;
        pendingReferrals: number;
        totalRewards: number;
        points: number;
        referrals: ({
            referred: {
                profile: {
                    firstName: string;
                    lastName: string;
                };
                email: string;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            status: string;
            rewardAmount: number | null;
            completedAt: Date | null;
            referrerId: string;
            referredId: string;
        })[];
    }>;
    getMyReferralCode(userId: string): Promise<string | {
        referralCode: string;
        referralLink: string;
    }>;
    markReferralCompleted(referredId: string): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        rewardAmount: number | null;
        completedAt: Date | null;
        referrerId: string;
        referredId: string;
    }>;
}
