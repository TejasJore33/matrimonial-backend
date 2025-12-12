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
exports.ChatEnhancementsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatEnhancementsService = class ChatEnhancementsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMessageTemplates(userId, category) {
        const where = { userId };
        if (category) {
            where.category = category;
        }
        return this.prisma.messageTemplate.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async createMessageTemplate(userId, name, content, category) {
        return this.prisma.messageTemplate.create({
            data: {
                userId,
                name,
                content,
                category,
            },
        });
    }
    async updateMessageTemplate(userId, templateId, name, content, category) {
        const template = await this.prisma.messageTemplate.findFirst({
            where: { id: templateId, userId },
        });
        if (!template) {
            throw new common_1.NotFoundException('Template not found');
        }
        return this.prisma.messageTemplate.update({
            where: { id: templateId },
            data: {
                name: name || template.name,
                content: content || template.content,
                category: category !== undefined ? category : template.category,
            },
        });
    }
    async deleteMessageTemplate(userId, templateId) {
        const template = await this.prisma.messageTemplate.findFirst({
            where: { id: templateId, userId },
        });
        if (!template) {
            throw new common_1.NotFoundException('Template not found');
        }
        return this.prisma.messageTemplate.delete({
            where: { id: templateId },
        });
    }
    async getIceBreakers(userId, profileId) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId: profileId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const defaultQuestions = [
            'What are your hobbies and interests?',
            'Tell me about your family background.',
            'What are you looking for in a life partner?',
            'What are your career goals?',
            'How do you spend your weekends?',
            'What values are most important to you?',
        ];
        const savedBreakers = await this.prisma.iceBreaker.findMany({
            where: { userId, profileId },
        });
        return {
            defaultQuestions,
            savedBreakers,
        };
    }
    async saveIceBreaker(userId, profileId, question, answer) {
        return this.prisma.iceBreaker.upsert({
            where: {
                userId_profileId: {
                    userId,
                    profileId,
                },
            },
            create: {
                userId,
                profileId,
                question,
                answer,
            },
            update: {
                question,
                answer,
            },
        });
    }
    async getChatReminders(userId) {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const chats = await this.prisma.chat.findMany({
            where: {
                OR: [{ user1Id: userId }, { user2Id: userId }],
            },
            include: {
                messages: {
                    where: {
                        senderId: { not: userId },
                        isRead: false,
                        createdAt: { lt: oneDayAgo },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                user1: {
                    include: {
                        profile: {
                            include: {
                                photos: {
                                    where: { isApproved: true },
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
                                    take: 1,
                                },
                            },
                        },
                    },
                },
            },
        });
        return chats
            .filter((chat) => chat.messages.length > 0)
            .map((chat) => ({
            chatId: chat.id,
            otherUser: chat.user1Id === userId ? chat.user2 : chat.user1,
            lastUnreadMessage: chat.messages[0],
            unreadCount: chat.messages.length,
        }));
    }
};
exports.ChatEnhancementsService = ChatEnhancementsService;
exports.ChatEnhancementsService = ChatEnhancementsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatEnhancementsService);
//# sourceMappingURL=chat-enhancements.service.js.map