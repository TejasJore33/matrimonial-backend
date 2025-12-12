import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
export declare class CommunityService {
    private prisma;
    private uploadService;
    constructor(prisma: PrismaService, uploadService: UploadService);
    createForumPost(userId: string, data: {
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
    getForumPosts(filters?: {
        category?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
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
    createForumComment(userId: string, postId: string, content: string): Promise<{
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
    createGroup(userId: string, data: {
        name: string;
        description: string;
        isPublic: boolean;
        photo?: Express.Multer.File;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        photoUrl: string | null;
        isPublic: boolean;
        createdBy: string;
    }>;
    joinGroup(userId: string, groupId: string): Promise<{
        role: string;
        id: string;
        userId: string;
        joinedAt: Date;
        groupId: string;
    }>;
    getGroups(filters?: {
        search?: string;
        isPublic?: boolean;
    }): Promise<({
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
    createEvent(userId: string, data: {
        title: string;
        description: string;
        eventDate: Date;
        location: string;
        maxParticipants?: number;
        photo?: Express.Multer.File;
    }): Promise<{
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
    joinEvent(userId: string, eventId: string): Promise<{
        id: string;
        userId: string;
        joinedAt: Date;
        eventId: string;
    }>;
    getEvents(filters?: {
        upcoming?: boolean;
        past?: boolean;
    }): Promise<({
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
    createBlogPost(userId: string, data: {
        title: string;
        content: string;
        excerpt?: string;
        tags?: string[];
        photo?: Express.Multer.File;
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
        title: string;
        views: number;
        content: string;
        tags: string[];
        photoUrl: string | null;
        excerpt: string | null;
        isPublished: boolean;
    }>;
    getBlogPosts(filters?: {
        published?: boolean;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
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
}
