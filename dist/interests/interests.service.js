"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterestsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const subscription_constants_1 = require("../common/constants/subscription.constants");
let InterestsService = class InterestsService {
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async sendInterest(fromUserId, toUserId, message) {
        if (fromUserId === toUserId) {
            throw new common_1.BadRequestException('Cannot send interest to yourself');
        }
        const existing = await this.prisma.interest.findUnique({
            where: {
                fromUserId_toUserId: {
                    fromUserId,
                    toUserId,
                },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Interest already sent');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: fromUserId },
            include: {
                subscriptions: {
                    where: {
                        status: 'ACTIVE',
                        endDate: { gt: new Date() },
                        plan: { in: [...subscription_constants_1.PAID_SUBSCRIPTION_PLANS] },
                    },
                },
            },
        });
        const hasPaidPlan = user.subscriptions.length > 0;
        if (!hasPaidPlan) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const count = await this.prisma.interest.count({
                where: {
                    fromUserId,
                    createdAt: { gte: today },
                },
            });
            if (count >= 5) {
                throw new common_1.BadRequestException('Daily interest limit reached. Upgrade to premium for unlimited interests.');
            }
        }
        const interest = await this.prisma.interest.create({
            data: {
                fromUserId,
                toUserId,
                message,
                status: 'PENDING',
            },
            include: {
                fromUser: {
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
            },
        });
        const reverseInterest = await this.prisma.interest.findUnique({
            where: {
                fromUserId_toUserId: {
                    fromUserId: toUserId,
                    toUserId: fromUserId,
                },
            },
        });
        if (reverseInterest && reverseInterest.status === 'PENDING') {
            await Promise.all([
                this.prisma.interest.update({
                    where: { id: interest.id },
                    data: { status: 'ACCEPTED' },
                }),
                this.prisma.interest.update({
                    where: { id: reverseInterest.id },
                    data: { status: 'ACCEPTED' },
                }),
                this.notificationsService.create(toUserId, 'MATCH', 'Mutual Match!', 'You both liked each other!', { matchedUserId: fromUserId }, { sendEmail: true, sendPush: true, sendRealTime: true }),
                this.notificationsService.create(fromUserId, 'MATCH', 'Mutual Match!', 'You both liked each other!', { matchedUserId: toUserId }, { sendEmail: true, sendPush: true, sendRealTime: true }),
                this.awardAchievement(fromUserId, 'FIRST_MATCH'),
                this.awardAchievement(toUserId, 'FIRST_MATCH'),
            ]);
        }
        else {
            await this.awardAchievement(fromUserId, 'FIRST_INTEREST');
            await this.notificationsService.create(toUserId, 'INTEREST', 'New Interest Received', 'Someone sent you an interest', { fromUserId }, { sendEmail: true, sendPush: true, sendRealTime: true });
        }
        return interest;
    }
    async acceptInterest(userId, interestId) {
        const interest = await this.prisma.interest.findUnique({
            where: { id: interestId },
        });
        if (!interest) {
            throw new common_1.NotFoundException('Interest not found');
        }
        if (interest.toUserId !== userId) {
            throw new common_1.BadRequestException('Unauthorized');
        }
        if (interest.status === 'ACCEPTED') {
            await this.ensureChatExists(interest.fromUserId, userId);
            return { message: 'Interest already accepted', alreadyProcessed: true };
        }
        if (interest.status === 'REJECTED') {
            throw new common_1.BadRequestException('Interest was already rejected');
        }
        const reverseInterest = await this.prisma.interest.findUnique({
            where: {
                fromUserId_toUserId: {
                    fromUserId: userId,
                    toUserId: interest.fromUserId,
                },
            },
        });
        if (reverseInterest && reverseInterest.status === 'PENDING') {
            await Promise.all([
                this.prisma.interest.update({
                    where: { id: interest.id },
                    data: { status: 'ACCEPTED' },
                }),
                this.prisma.interest.update({
                    where: { id: reverseInterest.id },
                    data: { status: 'ACCEPTED' },
                }),
                this.notificationsService.create(interest.fromUserId, 'MATCH', 'Mutual Match!', 'You both liked each other!', { matchedUserId: userId }, { sendEmail: true, sendPush: true, sendRealTime: true }),
            ]);
        }
        else {
            await this.prisma.interest.update({
                where: { id: interest.id },
                data: { status: 'ACCEPTED' },
            });
        }
        await this.ensureChatExists(interest.fromUserId, userId);
        return { message: 'Interest accepted' };
    }
    async rejectInterest(userId, interestId) {
        const interest = await this.prisma.interest.findUnique({
            where: { id: interestId },
        });
        if (!interest) {
            throw new common_1.NotFoundException('Interest not found');
        }
        if (interest.toUserId !== userId) {
            throw new common_1.BadRequestException('Unauthorized');
        }
        if (interest.status === 'REJECTED') {
            return { message: 'Interest already rejected', alreadyProcessed: true };
        }
        if (interest.status === 'ACCEPTED') {
            throw new common_1.BadRequestException('Interest was already accepted');
        }
        await this.prisma.interest.update({
            where: { id: interestId },
            data: { status: 'REJECTED' },
        });
        return { message: 'Interest rejected' };
    }
    async getReceivedInterests(userId) {
        return this.prisma.interest.findMany({
            where: {
                toUserId: userId,
                status: 'PENDING',
            },
            include: {
                fromUser: {
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
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getSentInterests(userId) {
        const interests = await this.prisma.interest.findMany({
            where: { fromUserId: userId },
            include: {
                toUser: {
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
            },
            orderBy: { createdAt: 'desc' },
        });
        const interestsWithChats = await Promise.all(interests.map(async (interest) => {
            if (interest.status === 'ACCEPTED') {
                const [id1, id2] = [userId, interest.toUserId].sort();
                const chat = await this.prisma.chat.findUnique({
                    where: {
                        user1Id_user2Id: {
                            user1Id: id1,
                            user2Id: id2,
                        },
                    },
                });
                return {
                    ...interest,
                    chatId: chat?.id || null,
                };
            }
            return interest;
        }));
        return interestsWithChats;
    }
    async getMatches(userId) {
        const interests = await this.prisma.interest.findMany({
            where: {
                OR: [
                    { fromUserId: userId, status: 'ACCEPTED' },
                    { toUserId: userId, status: 'ACCEPTED' },
                ],
            },
            include: {
                fromUser: {
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
                toUser: {
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
            },
        });
        const matchesWithChats = await Promise.all(interests.map(async (interest) => {
            const otherUserId = interest.fromUserId === userId ? interest.toUserId : interest.fromUserId;
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
            });
            return {
                ...interest,
                matchedUser: interest.fromUserId === userId ? interest.toUser : interest.fromUser,
                chatId: chat.id,
            };
        }));
        return matchesWithChats;
    }
    async withdrawInterest(userId, interestId) {
        const interest = await this.prisma.interest.findUnique({
            where: { id: interestId },
        });
        if (!interest) {
            throw new common_1.NotFoundException('Interest not found');
        }
        if (interest.fromUserId !== userId) {
            throw new common_1.BadRequestException('Unauthorized - You can only withdraw interests you sent');
        }
        if (interest.status !== 'PENDING') {
            throw new common_1.BadRequestException('Cannot withdraw interest that is not pending');
        }
        await this.prisma.interest.update({
            where: { id: interestId },
            data: { status: 'WITHDRAWN' },
        });
        return { message: 'Interest withdrawn successfully' };
    }
    async getInterestHistory(userId, filters) {
        const where = {};
        if (filters?.type === 'sent') {
            where.fromUserId = userId;
        }
        else if (filters?.type === 'received') {
            where.toUserId = userId;
        }
        else {
            where.OR = [
                { fromUserId: userId },
                { toUserId: userId },
            ];
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        return this.prisma.interest.findMany({
            where,
            include: {
                fromUser: {
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
                toUser: {
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
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getPendingInterestsReminder(userId) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const pendingInterests = await this.prisma.interest.findMany({
            where: {
                toUserId: userId,
                status: 'PENDING',
                createdAt: { lte: sevenDaysAgo },
            },
            include: {
                fromUser: {
                    include: {
                        profile: {
                            select: {
                                firstName: true,
                                lastName: true,
                                photos: {
                                    where: { isPrimary: true },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        return {
            count: pendingInterests.length,
            interests: pendingInterests,
            message: `You have ${pendingInterests.length} pending interest(s) waiting for your response`,
        };
    }
    async getInterestStats(userId) {
        const [sent, received, accepted, rejected, pending, withdrawn] = await Promise.all([
            this.prisma.interest.count({ where: { fromUserId: userId } }),
            this.prisma.interest.count({ where: { toUserId: userId } }),
            this.prisma.interest.count({
                where: {
                    OR: [
                        { fromUserId: userId, status: 'ACCEPTED' },
                        { toUserId: userId, status: 'ACCEPTED' },
                    ],
                },
            }),
            this.prisma.interest.count({ where: { toUserId: userId, status: 'REJECTED' } }),
            this.prisma.interest.count({ where: { toUserId: userId, status: 'PENDING' } }),
            this.prisma.interest.count({ where: { fromUserId: userId, status: 'WITHDRAWN' } }),
        ]);
        return {
            sent,
            received,
            accepted,
            rejected,
            pending,
            withdrawn,
            acceptanceRate: received > 0 ? Math.round((accepted / received) * 100) : 0,
        };
    }
    async ensureChatExists(user1Id, user2Id) {
        const [id1, id2] = [user1Id, user2Id].sort();
        await this.prisma.chat.upsert({
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
        });
    }
    async awardAchievement(userId, action) {
        try {
            const { GamificationService } = await Promise.resolve().then(() => __importStar(require('../gamification/gamification.service')));
            const gamificationService = new GamificationService(this.prisma);
            await gamificationService.checkAndAwardAchievements(userId, action);
        }
        catch (error) {
        }
    }
    async sendBulkInterests(fromUserId, userIds, message) {
        const results = [];
        for (const toUserId of userIds) {
            try {
                const interest = await this.sendInterest(fromUserId, toUserId, message);
                results.push({ userId: toUserId, success: true, interest });
            }
            catch (error) {
                results.push({ userId: toUserId, success: false, error: error.message });
            }
        }
        return {
            total: userIds.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            results,
        };
    }
};
exports.InterestsService = InterestsService;
exports.InterestsService = InterestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], InterestsService);
//# sourceMappingURL=interests.service.js.map