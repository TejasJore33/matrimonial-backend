import { ReferralService } from './referral.service';
export declare class ReferralController {
    private referralService;
    constructor(referralService: ReferralService);
    getMyReferralCode(user: any): Promise<string | {
        referralCode: string;
        referralLink: string;
    }>;
    applyReferralCode(user: any, body: {
        referralCode: string;
    }): Promise<{
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
    getReferralStats(user: any): Promise<{
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
}
