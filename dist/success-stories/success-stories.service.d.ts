import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
export declare class SuccessStoriesService {
    private prisma;
    private uploadService;
    constructor(prisma: PrismaService, uploadService: UploadService);
    submitStory(userId: string, partnerId: string, title: string, story: string, weddingDate?: Date, photos?: Express.Multer.File[]): Promise<any>;
    getStories(filters?: {
        approved?: boolean;
        featured?: boolean;
        limit?: number;
    }): Promise<any>;
    getStoryById(storyId: string): Promise<any>;
    getUserStories(userId: string): Promise<any>;
    approveStory(storyId: string, adminId: string): Promise<any>;
    featureStory(storyId: string, adminId: string): Promise<any>;
    deleteStory(storyId: string, userId: string, isAdmin?: boolean): Promise<{
        message: string;
    }>;
    getFeaturedStories(limit?: number): Promise<any>;
    getStoriesByFilters(filters: {
        region?: string;
        religion?: string;
        limit?: number;
        page?: number;
    }): Promise<{
        stories: any;
        total: any;
        page: number;
        limit: number;
    }>;
    getStoryStats(): Promise<{
        total: any;
        approved: any;
        featured: any;
        thisMonth: any;
        pending: number;
    }>;
}
