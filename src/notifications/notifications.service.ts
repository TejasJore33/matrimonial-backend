import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import { SmsService } from '../common/services/sms.service';
import { PushService } from '../common/services/push.service';
import { NotificationGatewayService } from '../common/services/notification-gateway.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private smsService: SmsService,
    private pushService: PushService,
    private notificationGateway: NotificationGatewayService,
  ) {}

  async create(
    userId: string,
    type: string,
    title: string,
    message: string,
    metadata?: any,
    options?: {
      sendEmail?: boolean;
      sendSms?: boolean;
      sendPush?: boolean;
      sendRealTime?: boolean;
    },
  ) {
    // Get user details and preferences for sending notifications
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        mobile: true,
        fcmToken: true,
        notificationPreferences: true,
      },
    });

    // Get user preferences
    const preferences = await this.getNotificationPreferences(userId);

    // Create notification in database
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata,
      },
    });

    // Determine notification type for preference checking
    const notificationType = type.toLowerCase();
    const isInterest = notificationType.includes('interest');
    const isMessage = notificationType.includes('message');
    const isMatch = notificationType.includes('match');
    const isView = notificationType.includes('view');

    // Check user preferences and override with options if provided
    const sendOptions = {
      sendEmail: options?.sendEmail !== undefined 
        ? options.sendEmail 
        : (isInterest && preferences.email.interests) ||
          (isMessage && preferences.email.messages) ||
          (isMatch && preferences.email.matches) ||
          (isView && preferences.email.views) ||
          false,
      sendSms: options?.sendSms !== undefined 
        ? options.sendSms 
        : preferences.sms.importantOnly && (isMatch || isInterest),
      sendPush: options?.sendPush !== undefined 
        ? options.sendPush 
        : (isInterest && preferences.push.interests) ||
          (isMessage && preferences.push.messages) ||
          (isMatch && preferences.push.matches) ||
          (isView && preferences.push.views) ||
          false,
      sendRealTime: options?.sendRealTime ?? true,
    };

    // Send email notification
    if (sendOptions.sendEmail && user?.email) {
      this.emailService
        .sendNotificationEmail(user.email, title, message, type)
        .catch((error) => {
          this.logger.error(`Failed to send email notification to ${user.email}:`, error);
        });
    }

    // Send SMS notification (only for important notifications)
    if (sendOptions.sendSms && user?.mobile) {
      this.smsService
        .sendNotificationSms(user.mobile, `${title}: ${message}`)
        .catch((error) => {
          this.logger.error(`Failed to send SMS notification to ${user.mobile}:`, error);
        });
    }

    // Send push notification
    if (sendOptions.sendPush && user?.fcmToken) {
      this.pushService
        .sendPushNotification(user.fcmToken, title, message, {
          notificationId: notification.id,
          type,
          ...metadata,
        })
        .catch((error) => {
          this.logger.error(`Failed to send push notification to user ${userId}:`, error);
        });
    }

    // Send real-time notification via WebSocket
    if (sendOptions.sendRealTime) {
      this.notificationGateway.sendNotificationToUser(userId, notification);
    }

    return notification;
  }

  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      unreadCount: await this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    };
  }

  async markAsRead(userId: string, notificationIds: string[]) {
    await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteNotification(userId: string, notificationId: string) {
    await this.prisma.notification.delete({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  async getNotificationPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    // Default preferences
    const defaultPreferences = {
      email: {
        interests: true,
        messages: false,
        matches: true,
        views: false,
        dailyDigest: true,
      },
      push: {
        interests: true,
        messages: true,
        matches: true,
        views: false,
      },
      sms: {
        importantOnly: true,
      },
    };

    // If user has saved preferences, merge with defaults (user preferences override defaults)
    if (user?.notificationPreferences) {
      const savedPrefs = user.notificationPreferences as any;
      return {
        email: { ...defaultPreferences.email, ...(savedPrefs.email || {}) },
        push: { ...defaultPreferences.push, ...(savedPrefs.push || {}) },
        sms: { ...defaultPreferences.sms, ...(savedPrefs.sms || {}) },
      };
    }

    return defaultPreferences;
  }

  async updateNotificationPreferences(userId: string, preferences: any) {
    // Validate preferences structure
    const validPreferences = {
      email: {
        interests: preferences.email?.interests ?? true,
        messages: preferences.email?.messages ?? false,
        matches: preferences.email?.matches ?? true,
        views: preferences.email?.views ?? false,
        dailyDigest: preferences.email?.dailyDigest ?? true,
      },
      push: {
        interests: preferences.push?.interests ?? true,
        messages: preferences.push?.messages ?? true,
        matches: preferences.push?.matches ?? true,
        views: preferences.push?.views ?? false,
      },
      sms: {
        importantOnly: preferences.sms?.importantOnly ?? true,
      },
    };

    // Save to database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        notificationPreferences: validPreferences,
      },
    });

    return {
      message: 'Preferences updated successfully',
      preferences: validPreferences,
    };
  }

  async getNotificationHistory(userId: string, filters?: { type?: string; read?: boolean; limit?: number }) {
    const where: any = { userId };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.read !== undefined) {
      where.isRead = filters.read;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    });
  }
}

