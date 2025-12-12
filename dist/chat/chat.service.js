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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let ChatService = class ChatService {
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async getChats(userId) {
        const chats = await this.prisma.chat.findMany({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId },
                ],
            },
            include: {
                user1: {
                    include: {
                        profile: {
                            include: {
                                photos: {
                                    where: { isApproved: true },
                                    orderBy: { order: 'asc' },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
                user2: {
                    include: {
                        profile: {
                            include: {
                                photos: {
                                    where: { isApproved: true },
                                    orderBy: { order: 'asc' },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { lastMessageAt: 'desc' },
        });
        const chatsWithUnread = await Promise.all(chats.map(async (chat) => {
            const unreadCount = await this.prisma.message.count({
                where: {
                    chatId: chat.id,
                    senderId: { not: userId },
                    isRead: false,
                    AND: [
                        { isDeleted: false },
                        { NOT: { deletedBy: { has: userId } } },
                    ],
                },
            });
            return {
                ...chat,
                otherUser: chat.user1Id === userId ? chat.user2 : chat.user1,
                lastMessage: chat.messages[0] || null,
                unreadCount,
            };
        }));
        return chatsWithUnread;
    }
    async getUnreadCount(userId) {
        const chats = await this.prisma.chat.findMany({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId },
                ],
            },
            select: { id: true },
        });
        const chatIds = chats.map(chat => chat.id);
        const totalUnread = await this.prisma.message.count({
            where: {
                chatId: { in: chatIds },
                senderId: { not: userId },
                isRead: false,
                AND: [
                    { isDeleted: false },
                    { NOT: { deletedBy: { has: userId } } },
                ],
            },
        });
        return { totalUnread };
    }
    async getChat(chatId, userId) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                user1: {
                    include: {
                        profile: {
                            include: {
                                photos: {
                                    where: { isApproved: true },
                                    orderBy: { order: 'asc' },
                                },
                            },
                        },
                    },
                },
                user2: {
                    include: {
                        profile: {
                            include: {
                                photos: {
                                    where: { isApproved: true },
                                    orderBy: { order: 'asc' },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!chat) {
            throw new common_1.NotFoundException('Chat not found');
        }
        if (chat.user1Id !== userId && chat.user2Id !== userId) {
            throw new common_1.BadRequestException('Unauthorized');
        }
        return {
            ...chat,
            currentUserId: userId,
            otherUser: chat.user1Id === userId ? chat.user2 : chat.user1,
        };
    }
    async getOrCreateChat(userId, otherUserId) {
        const interest = await this.prisma.interest.findFirst({
            where: {
                OR: [
                    { fromUserId: userId, toUserId: otherUserId, status: 'ACCEPTED' },
                    { fromUserId: otherUserId, toUserId: userId, status: 'ACCEPTED' },
                ],
            },
        });
        if (!interest) {
            throw new common_1.BadRequestException('No accepted interest found. Interest must be accepted before chatting.');
        }
        const [id1, id2] = [userId, otherUserId].sort();
        const chat = await this.prisma.chat.upsert({
            where: {
                user1Id_user2Id: {
                    user1Id: id1,
                    user2Id: id2,
                },
            },
            create: {
                user1Id: id1,
                user2Id: id2,
            },
            update: {},
            include: {
                user1: {
                    include: {
                        profile: {
                            include: {
                                photos: {
                                    where: { isApproved: true },
                                    orderBy: { order: 'asc' },
                                },
                            },
                        },
                    },
                },
                user2: {
                    include: {
                        profile: {
                            include: {
                                photos: {
                                    where: { isApproved: true },
                                    orderBy: { order: 'asc' },
                                },
                            },
                        },
                    },
                },
            },
        });
        return {
            ...chat,
            currentUserId: userId,
            otherUser: chat.user1Id === userId ? chat.user2 : chat.user1,
        };
    }
    async getMessages(chatId, userId, page = 1, limit = 50) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
        });
        if (!chat || (chat.user1Id !== userId && chat.user2Id !== userId)) {
            throw new common_1.BadRequestException('Unauthorized');
        }
        const skip = (page - 1) * limit;
        const [messages, total] = await Promise.all([
            this.prisma.message.findMany({
                where: {
                    chatId,
                    AND: [
                        { isDeleted: false },
                        { NOT: { deletedBy: { has: userId } } },
                    ],
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            profile: {
                                include: {
                                    photos: {
                                        where: { isApproved: true },
                                        orderBy: { order: 'asc' },
                                        take: 1,
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.message.count({
                where: {
                    chatId,
                    AND: [
                        { isDeleted: false },
                        { NOT: { deletedBy: { has: userId } } },
                    ],
                },
            }),
        ]);
        await this.prisma.message.updateMany({
            where: {
                chatId,
                senderId: { not: userId },
                isRead: false,
                isDeleted: false,
            },
            data: { isRead: true },
        });
        return {
            messages: messages.reverse(),
            total,
            page,
            limit,
        };
    }
    async sendMessage(userId, chatId, data) {
        const chat = await this.getChat(chatId, userId);
        const messageType = data.messageType || (data.imageUrl ? 'IMAGE' : data.videoUrl ? 'VIDEO' : data.audioUrl ? 'AUDIO' : data.fileUrl ? 'FILE' : 'TEXT');
        if (data.content && this.containsOffensiveLanguage(data.content)) {
            console.warn(`Message flagged for offensive language from user ${userId}`);
        }
        const message = await this.prisma.message.create({
            data: {
                chatId,
                senderId: userId,
                content: data.content,
                imageUrl: data.imageUrl,
                videoUrl: data.videoUrl,
                audioUrl: data.audioUrl,
                fileUrl: data.fileUrl,
                fileName: data.fileName,
                messageType,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        profile: {
                            include: {
                                photos: {
                                    where: { isApproved: true },
                                    orderBy: { order: 'asc' },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
            },
        });
        await this.prisma.chat.update({
            where: { id: chatId },
            data: { lastMessageAt: new Date() },
        });
        const otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
        const notificationText = data.content
            ? (data.content.length > 50 ? data.content.substring(0, 50) + '...' : data.content)
            : messageType === 'IMAGE' ? 'Sent an image'
                : messageType === 'VIDEO' ? 'Sent a video'
                    : messageType === 'AUDIO' ? 'Sent a voice message'
                        : messageType === 'FILE' ? 'Sent a file'
                            : 'Sent a message';
        await this.notificationsService.create(otherUserId, 'MESSAGE', 'New Message', notificationText, { chatId, senderId: userId, messageId: message.id }, { sendEmail: false, sendPush: true, sendRealTime: true });
        return message;
    }
    async searchMessages(userId, chatId, query, page = 1, limit = 20) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
        });
        if (!chat || (chat.user1Id !== userId && chat.user2Id !== userId)) {
            throw new common_1.BadRequestException('Unauthorized');
        }
        const skip = (page - 1) * limit;
        const [messages, total] = await Promise.all([
            this.prisma.message.findMany({
                where: {
                    chatId,
                    AND: [
                        { isDeleted: false },
                        { NOT: { deletedBy: { has: userId } } },
                        {
                            content: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                    ],
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            profile: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.message.count({
                where: {
                    chatId,
                    AND: [
                        { isDeleted: false },
                        { NOT: { deletedBy: { has: userId } } },
                        {
                            content: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                    ],
                },
            }),
        ]);
        return {
            messages,
            total,
            page,
            limit,
            query,
        };
    }
    async markAsRead(userId, chatId, messageIds) {
        await this.prisma.message.updateMany({
            where: {
                id: { in: messageIds },
                chatId,
                senderId: { not: userId },
            },
            data: { isRead: true },
        });
    }
    async deleteMessage(userId, messageId, deleteForEveryone = false) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: {
                chat: true,
            },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        const isParticipant = message.chat.user1Id === userId || message.chat.user2Id === userId;
        if (!isParticipant) {
            throw new common_1.BadRequestException('Unauthorized: You are not a participant in this chat');
        }
        if (deleteForEveryone) {
            await this.prisma.message.update({
                where: { id: messageId },
                data: { isDeleted: true },
            });
        }
        else {
            const currentDeletedBy = Array.isArray(message.deletedBy) ? message.deletedBy : [];
            if (!currentDeletedBy.includes(userId)) {
                await this.prisma.message.update({
                    where: { id: messageId },
                    data: { deletedBy: { set: [...currentDeletedBy, userId] } },
                });
            }
        }
        return { message: 'Message deleted' };
    }
    async reportMessage(userId, messageId, reason) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        await this.prisma.message.update({
            where: { id: messageId },
            data: { isReported: true },
        });
        await this.prisma.report.create({
            data: {
                reporterId: userId,
                reportedUserId: message.senderId,
                type: 'MESSAGE',
                reason,
                description: `Message ID: ${messageId}`,
            },
        });
        return { message: 'Message reported' };
    }
    containsOffensiveLanguage(text) {
        const offensiveWords = [
            'spam', 'scam', 'fraud', 'phishing',
            'hate', 'kill', 'die',
        ];
        const lowerText = text.toLowerCase();
        return offensiveWords.some(word => {
            const regex = new RegExp(`\\b${word}\\w*\\b`, 'i');
            return regex.test(lowerText);
        });
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ChatService);
//# sourceMappingURL=chat.service.js.map