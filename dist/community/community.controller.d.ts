import { CommunityService } from './community.service';
export declare class CommunityController {
    private communityService;
    constructor(communityService: CommunityService);
    createForumPost(user: any, body: {
        title: string;
        content: string;
        category?: string;
        tags?: string[];
    }): Promise<{
        user: {
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
            email: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        views: number;
        content: string;
        category: string | null;
        tags: string[];
        likes: number;
        isPinned: boolean;
    }>;
    getForumPosts(category?: string, search?: string, page?: string, limit?: string): Promise<{
        posts: ({
            user: {
                profile: {
                    firstName: string;
                    lastName: string;
                };
                id: string;
            };
            _count: {
                comments: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            title: string;
            views: number;
            content: string;
            category: string | null;
            tags: string[];
            likes: number;
            isPinned: boolean;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createForumComment(user: any, postId: string, body: {
        content: string;
    }): Promise<{
        user: {
            profile: {
                firstName: string;
                lastName: string;
            };
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        content: string;
        postId: string;
    }>;
    createGroup(user: any, body: {
        name: string;
        description: string;
        isPublic: string;
    }, photo?: Express.Multer.File): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        photoUrl: string | null;
        isPublic: boolean;
        createdBy: string;
    }>;
    getGroups(search?: string, isPublic?: string): Promise<({
        _count: {
            members: number;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        photoUrl: string | null;
        isPublic: boolean;
        createdBy: string;
    })[]>;
    joinGroup(user: any, groupId: string): Promise<{
        role: string;
        id: string;
        userId: string;
        joinedAt: Date;
        groupId: string;
    }>;
    createEvent(user: any, body: {
        title: string;
        description: string;
        eventDate: string;
        location: string;
        maxParticipants?: string;
    }, photo?: Express.Multer.File): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        location: string;
        photoUrl: string | null;
        createdBy: string;
        eventDate: Date;
        maxParticipants: number | null;
    }>;
    getEvents(upcoming?: string, past?: string): Promise<({
        _count: {
            participants: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        location: string;
        photoUrl: string | null;
        createdBy: string;
        eventDate: Date;
        maxParticipants: number | null;
    })[]>;
    joinEvent(user: any, eventId: string): Promise<{
        id: string;
        userId: string;
        joinedAt: Date;
        eventId: string;
    }>;
    createBlogPost(user: any, body: {
        title: string;
        content: string;
        excerpt?: string;
        tags?: string[];
    }, photo?: Express.Multer.File): Promise<{
        user: {
            profile: {
                firstName: string;
                lastName: string;
            };
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        views: number;
        content: string;
        tags: string[];
        photoUrl: string | null;
        excerpt: string | null;
        isPublished: boolean;
    }>;
    getBlogPosts(published?: string, search?: string, page?: string, limit?: string): Promise<{
        posts: ({
            user: {
                profile: {
                    firstName: string;
                    lastName: string;
                };
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            title: string;
            views: number;
            content: string;
            tags: string[];
            photoUrl: string | null;
            excerpt: string | null;
            isPublished: boolean;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    publishBlogPost(id: string): Promise<{
        message: string;
    }>;
}
