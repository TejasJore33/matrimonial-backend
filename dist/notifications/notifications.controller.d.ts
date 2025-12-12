import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsController {
    private notificationsService;
    private prisma;
    constructor(notificationsService: NotificationsService, prisma: PrismaService);
    getNotifications(user: any, page?: string, limit?: string): Promise<{
        notifications: {
            message: string;
            type: string;
            id: string;
            createdAt: Date;
            userId: string;
            title: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            isRead: boolean;
        }[];
        total: number;
        page: number;
        limit: number;
        unreadCount: number;
    }>;
    markAsRead(user: any, body: {
        notificationIds: string[];
    }): Promise<void>;
    markAllAsRead(user: any): Promise<void>;
    deleteNotification(user: any, id: string): Promise<void>;
    updateFcmToken(user: any, body: {
        fcmToken: string;
    }): Promise<{
        message: string;
    }>;
    getPreferences(user: any): Promise<{
        email: any;
        push: any;
        sms: any;
    }>;
    updatePreferences(user: any, preferences: any): Promise<{
        message: string;
        preferences: {
            email: {
                interests: any;
                messages: any;
                matches: any;
                views: any;
                dailyDigest: any;
            };
            push: {
                interests: any;
                messages: any;
                matches: any;
                views: any;
            };
            sms: {
                importantOnly: any;
            };
        };
    }>;
    getHistory(user: any, type?: string, read?: string, limit?: string): Promise<{
        message: string;
        type: string;
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
    }[]>;
}
