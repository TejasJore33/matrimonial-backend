import { PrismaService } from '../prisma/prisma.service';
export declare class BlockService {
    private prisma;
    constructor(prisma: PrismaService);
    blockUser(blockerId: string, blockedId: string, reason?: string): Promise<{
        message: string;
    }>;
    unblockUser(blockerId: string, blockedId: string): Promise<{
        message: string;
    }>;
    getBlockedUsers(userId: string): Promise<({
        blocked: {
            profile: {
                id: string;
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
            email: string;
            mobile: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        reason: string | null;
        blockerId: string;
        blockedId: string;
    })[]>;
    isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
    checkBlockedStatus(userId1: string, userId2: string): Promise<{
        isBlocked: boolean;
        blockedBy: string | null;
    }>;
}
