import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import { SmsService } from '../common/services/sms.service';
import { PushService } from '../common/services/push.service';
import { NotificationGatewayService } from '../common/services/notification-gateway.service';
export declare class NotificationsService {
    private prisma;
    private emailService;
    private smsService;
    private pushService;
    private notificationGateway;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService, smsService: SmsService, pushService: PushService, notificationGateway: NotificationGatewayService);
    create(userId: string, type: string, title: string, message: string, metadata?: any, options?: {
        sendEmail?: boolean;
        sendSms?: boolean;
        sendPush?: boolean;
        sendRealTime?: boolean;
    }): Promise<{
        message: string;
        type: string;
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
    }>;
    getUserNotifications(userId: string, page?: number, limit?: number): Promise<{
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
    markAsRead(userId: string, notificationIds: string[]): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    deleteNotification(userId: string, notificationId: string): Promise<void>;
    getNotificationPreferences(userId: string): Promise<{
        email: any;
        push: any;
        sms: any;
    }>;
    updateNotificationPreferences(userId: string, preferences: any): Promise<{
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
    getNotificationHistory(userId: string, filters?: {
        type?: string;
        read?: boolean;
        limit?: number;
    }): Promise<{
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
