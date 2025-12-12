import { SafetyService } from './safety.service';
export declare class SafetyController {
    private safetyService;
    constructor(safetyService: SafetyService);
    reportUser(user: any, body: {
        reportedUserId: string;
        type: 'PROFILE' | 'MESSAGE' | 'PHOTO';
        reason: string;
        description?: string;
        messageId?: string;
        photoId?: string;
    }): Promise<{
        type: string;
        id: string;
        createdAt: Date;
        status: string;
        description: string | null;
        reporterId: string;
        reportedUserId: string;
        reason: string;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    }>;
    getSafetyTips(): Promise<{
        tips: {
            title: string;
            description: string;
        }[];
        emergencyContacts: {
            helpline: string;
            email: string;
            reportUrl: string;
        };
    }>;
    getBlockedUsers(user: any): Promise<({
        blocked: {
            profile: {
                firstName: string;
                lastName: string;
                photos: {
                    url: string;
                    id: string;
                    createdAt: Date;
                    profileId: string;
                    cloudinaryId: string | null;
                    isPrimary: boolean;
                    isBlurred: boolean;
                    isApproved: boolean;
                    order: number;
                    albumName: string | null;
                    caption: string | null;
                }[];
            };
        } & {
            email: string | null;
            mobile: string | null;
            password: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            googleId: string | null;
            appleId: string | null;
            referralCode: string | null;
            isEmailVerified: boolean;
            isMobileVerified: boolean;
            fcmToken: string | null;
            referredBy: string | null;
            points: number;
            lastActiveAt: Date | null;
            isOnline: boolean;
            lastLoginDate: Date | null;
            loginStreak: number;
            createdAt: Date;
            updatedAt: Date;
            lastLoginAt: Date | null;
            gdprConsent: boolean;
            gdprConsentAt: Date | null;
            deletedAt: Date | null;
            preferredLanguage: string | null;
            notificationPreferences: import("@prisma/client/runtime/library").JsonValue | null;
        };
    } & {
        id: string;
        createdAt: Date;
        reason: string | null;
        blockerId: string;
        blockedId: string;
    })[]>;
    getUserReports(user: any): Promise<{
        reportedUser: {
            profile: {
                firstName: string;
                lastName: string;
            };
            email: string;
            id: string;
        };
        type: string;
        id: string;
        createdAt: Date;
        status: string;
        description: string | null;
        reporterId: string;
        reportedUserId: string;
        reason: string;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    }[]>;
    getSafetyStats(user: any): Promise<{
        reportsMade: number;
        blockedCount: number;
        reportsReceived: number;
        safetyScore: number;
    }>;
}
