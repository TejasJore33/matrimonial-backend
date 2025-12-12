"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../common/services/email.service");
const sms_service_1 = require("../common/services/sms.service");
const push_service_1 = require("../common/services/push.service");
const notification_gateway_service_1 = require("../common/services/notification-gateway.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma, emailService, smsService, pushService, notificationGateway) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.smsService = smsService;
        this.pushService = pushService;
        this.notificationGateway = notificationGateway;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    async create(userId, type, title, message, metadata, options) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                email: true,
                mobile: true,
                fcmToken: true,
                notificationPreferences: true,
            },
        });
        const preferences = await this.getNotificationPreferences(userId);
        const notification = await this.prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                metadata,
            },
        });
        const notificationType = type.toLowerCase();
        const isInterest = notificationType.includes('interest');
        const isMessage = notificationType.includes('message');
        const isMatch = notificationType.includes('match');
        const isView = notificationType.includes('view');
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
        if (sendOptions.sendEmail && user?.email) {
            this.emailService
                .sendNotificationEmail(user.email, title, message, type)
                .catch((error) => {
                this.logger.error(`Failed to send email notification to ${user.email}:`, error);
            });
        }
        if (sendOptions.sendSms && user?.mobile) {
            this.smsService
                .sendNotificationSms(user.mobile, `${title}: ${message}`)
                .catch((error) => {
                this.logger.error(`Failed to send SMS notification to ${user.mobile}:`, error);
            });
        }
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
        if (sendOptions.sendRealTime) {
            this.notificationGateway.sendNotificationToUser(userId, notification);
        }
        return notification;
    }
    async getUserNotifications(userId, page = 1, limit = 20) {
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
    async markAsRead(userId, notificationIds) {
        await this.prisma.notification.updateMany({
            where: {
                id: { in: notificationIds },
                userId,
            },
            data: { isRead: true },
        });
    }
    async markAllAsRead(userId) {
        await this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
    async deleteNotification(userId, notificationId) {
        await this.prisma.notification.delete({
            where: {
                id: notificationId,
                userId,
            },
        });
    }
    async getNotificationPreferences(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { notificationPreferences: true },
        });
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
        if (user?.notificationPreferences) {
            const savedPrefs = user.notificationPreferences;
            return {
                email: { ...defaultPreferences.email, ...(savedPrefs.email || {}) },
                push: { ...defaultPreferences.push, ...(savedPrefs.push || {}) },
                sms: { ...defaultPreferences.sms, ...(savedPrefs.sms || {}) },
            };
        }
        return defaultPreferences;
    }
    async updateNotificationPreferences(userId, preferences) {
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
    async getNotificationHistory(userId, filters) {
        const where = { userId };
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
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        sms_service_1.SmsService,
        push_service_1.PushService,
        notification_gateway_service_1.NotificationGatewayService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map