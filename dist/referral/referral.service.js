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
exports.ReferralService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReferralService = class ReferralService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateReferralCode(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.referralCode) {
            return user.referralCode;
        }
        let referralCode;
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
            referralCode = `${user.email?.substring(0, 3).toUpperCase() || 'USR'}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const existing = await this.prisma.user.findUnique({
                where: { referralCode },
            });
            if (!existing) {
                isUnique = true;
            }
            attempts++;
        }
        if (!isUnique) {
            referralCode = `REF${userId.substring(0, 8).toUpperCase()}`;
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { referralCode },
        });
        return referralCode;
    }
    async applyReferralCode(userId, referralCode) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                referredByRef: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.referredBy) {
            throw new common_1.BadRequestException('You have already used a referral code');
        }
        if (user.referralCode === referralCode) {
            throw new common_1.BadRequestException('Cannot use your own referral code');
        }
        const referrer = await this.prisma.user.findUnique({
            where: { referralCode },
        });
        if (!referrer) {
            throw new common_1.NotFoundException('Invalid referral code');
        }
        const referral = await this.prisma.referral.create({
            data: {
                referrerId: referrer.id,
                referredId: userId,
                status: 'PENDING',
            },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { referredBy: referrer.id },
        });
        const rewardPoints = 100;
        await this.prisma.user.update({
            where: { id: referrer.id },
            data: {
                points: {
                    increment: rewardPoints,
                },
            },
        });
        await this.prisma.achievement.create({
            data: {
                userId: referrer.id,
                type: 'REFERRAL',
                title: 'First Referral',
                description: 'You referred your first friend!',
                points: rewardPoints,
            },
        });
        return {
            message: 'Referral code applied successfully',
            referral,
            rewardPoints,
        };
    }
    async getReferralStats(userId) {
        const [referrals, totalRewards, completedReferrals] = await Promise.all([
            this.prisma.referral.findMany({
                where: { referrerId: userId },
                include: {
                    referred: {
                        select: {
                            id: true,
                            email: true,
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
            }),
            this.prisma.referral.aggregate({
                where: { referrerId: userId },
                _sum: {
                    rewardAmount: true,
                },
            }),
            this.prisma.referral.count({
                where: {
                    referrerId: userId,
                    status: 'COMPLETED',
                },
            }),
        ]);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                referralCode: true,
                referredBy: true,
                points: true,
            },
        });
        return {
            referralCode: user.referralCode,
            totalReferrals: referrals.length,
            completedReferrals,
            pendingReferrals: referrals.filter(r => r.status === 'PENDING').length,
            totalRewards: totalRewards._sum.rewardAmount || 0,
            points: user.points,
            referrals,
        };
    }
    async getMyReferralCode(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                referralCode: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!user.referralCode) {
            return this.generateReferralCode(userId);
        }
        return {
            referralCode: user.referralCode,
            referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${user.referralCode}`,
        };
    }
    async markReferralCompleted(referredId) {
        const referral = await this.prisma.referral.findFirst({
            where: {
                referredId,
                status: 'PENDING',
            },
        });
        if (!referral) {
            return;
        }
        const rewardAmount = 500;
        await this.prisma.referral.update({
            where: { id: referral.id },
            data: {
                status: 'COMPLETED',
                rewardAmount,
                completedAt: new Date(),
            },
        });
        await this.prisma.user.update({
            where: { id: referral.referrerId },
            data: {
                points: {
                    increment: rewardAmount,
                },
            },
        });
        return referral;
    }
};
exports.ReferralService = ReferralService;
exports.ReferralService = ReferralService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReferralService);
//# sourceMappingURL=referral.service.js.map