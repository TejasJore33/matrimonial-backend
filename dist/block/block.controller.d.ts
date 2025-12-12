import { BlockService } from './block.service';
export declare class BlockController {
    private blockService;
    constructor(blockService: BlockService);
    blockUser(user: any, body: {
        userId: string;
        reason?: string;
    }): Promise<{
        message: string;
    }>;
    unblockUser(user: any, userId: string): Promise<{
        message: string;
    }>;
    getBlockedUsers(user: any): Promise<({
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
    checkBlocked(user: any, userId: string): Promise<{
        isBlocked: boolean;
        blockedBy: string | null;
    }>;
}
