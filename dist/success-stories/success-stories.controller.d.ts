import { SuccessStoriesService } from './success-stories.service';
export declare class SuccessStoriesController {
    private successStoriesService;
    constructor(successStoriesService: SuccessStoriesService);
    submitStory(user: any, body: {
        partnerId: string;
        title: string;
        story: string;
        weddingDate?: string;
    }, photos?: Express.Multer.File[]): Promise<any>;
    getStories(approved?: string, featured?: string, limit?: string, region?: string, religion?: string, page?: string): Promise<any>;
    getFeaturedStories(limit?: string): Promise<any>;
    getStoryStats(): Promise<{
        total: any;
        approved: any;
        featured: any;
        thisMonth: any;
        pending: number;
    }>;
    getUserStories(user: any): Promise<any>;
    getStoryById(id: string): Promise<any>;
    approveStory(user: any, id: string): Promise<any>;
    featureStory(user: any, id: string): Promise<any>;
    deleteStory(user: any, id: string): Promise<{
        message: string;
    }>;
}
