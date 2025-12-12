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
exports.BlockService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BlockService = class BlockService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async blockUser(blockerId, blockedId, reason) {
        if (blockerId === blockedId) {
            throw new common_1.BadRequestException('Cannot block yourself');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: blockedId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const existing = await this.prisma.blockedUser.findUnique({
            where: {
                blockerId_blockedId: {
                    blockerId,
                    blockedId,
                },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('User already blocked');
        }
        await this.prisma.blockedUser.create({
            data: {
                blockerId,
                blockedId,
                reason,
            },
        });
        await this.prisma.interest.deleteMany({
            where: {
                OR: [
                    { fromUserId: blockerId, toUserId: blockedId },
                    { fromUserId: blockedId, toUserId: blockerId },
                ],
            },
        });
        await this.prisma.chat.deleteMany({
            where: {
                OR: [
                    { user1Id: blockerId, user2Id: blockedId },
                    { user1Id: blockedId, user2Id: blockerId },
                ],
            },
        });
        return { message: 'User blocked successfully' };
    }
    async unblockUser(blockerId, blockedId) {
        const blocked = await this.prisma.blockedUser.findUnique({
            where: {
                blockerId_blockedId: {
                    blockerId,
                    blockedId,
                },
            },
        });
        if (!blocked) {
            throw new common_1.NotFoundException('User not blocked');
        }
        await this.prisma.blockedUser.delete({
            where: {
                blockerId_blockedId: {
                    blockerId,
                    blockedId,
                },
            },
        });
        return { message: 'User unblocked successfully' };
    }
    async getBlockedUsers(userId) {
        return this.prisma.blockedUser.findMany({
            where: { blockerId: userId },
            include: {
                blocked: {
                    select: {
                        id: true,
                        email: true,
                        mobile: true,
                        profile: {
                            select: {
                                id: true,
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
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async isBlocked(blockerId, blockedId) {
        const blocked = await this.prisma.blockedUser.findUnique({
            where: {
                blockerId_blockedId: {
                    blockerId,
                    blockedId,
                },
            },
        });
        return !!blocked;
    }
    async checkBlockedStatus(userId1, userId2) {
        const block1 = await this.prisma.blockedUser.findUnique({
            where: {
                blockerId_blockedId: {
                    blockerId: userId1,
                    blockedId: userId2,
                },
            },
        });
        const block2 = await this.prisma.blockedUser.findUnique({
            where: {
                blockerId_blockedId: {
                    blockerId: userId2,
                    blockedId: userId1,
                },
            },
        });
        if (block1) {
            return { isBlocked: true, blockedBy: userId1 };
        }
        if (block2) {
            return { isBlocked: true, blockedBy: userId2 };
        }
        return { isBlocked: false, blockedBy: null };
    }
};
exports.BlockService = BlockService;
exports.BlockService = BlockService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BlockService);
//# sourceMappingURL=block.service.js.map