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
exports.SafetyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let SafetyService = class SafetyService {
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async reportUser(reporterId, reportedUserId, type, reason, description, messageId, photoId) {
        if (reporterId === reportedUserId) {
            throw new common_1.BadRequestException('Cannot report yourself');
        }
        const existing = await this.prisma.report.findFirst({
            where: {
                reporterId,
                reportedUserId,
                type,
                status: 'PENDING',
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('You have already reported this user');
        }
        const report = await this.prisma.report.create({
            data: {
                reporterId,
                reportedUserId,
                type,
                reason,
                description,
            },
        });
        const admins = await this.prisma.user.findMany({
            where: { role: 'ADMIN' },
        });
        for (const admin of admins) {
            await this.notificationsService.create(admin.id, 'REPORT', 'New Report Submitted', `A user has been reported: ${reason}`, { reportId: report.id, reporterId, reportedUserId }, { sendEmail: true, sendPush: false, sendRealTime: true });
        }
        return report;
    }
    async getSafetyTips() {
        return {
            tips: [
                {
                    title: 'Protect Your Personal Information',
                    description: 'Never share your personal contact details, address, or financial information in early conversations.',
                },
                {
                    title: 'Meet in Public Places',
                    description: 'Always meet in public places for the first few times. Inform a friend or family member about your plans.',
                },
                {
                    title: 'Trust Your Instincts',
                    description: 'If something feels off or makes you uncomfortable, trust your instincts and take appropriate action.',
                },
                {
                    title: 'Verify Profiles',
                    description: 'Look for verified profiles with complete information and multiple photos.',
                },
                {
                    title: 'Report Suspicious Behavior',
                    description: 'Report any suspicious behavior, harassment, or inappropriate content immediately.',
                },
                {
                    title: 'Take Your Time',
                    description: 'Take time to know the person before sharing personal information or meeting in person.',
                },
                {
                    title: 'Video Call First',
                    description: 'Consider having a video call before meeting in person to verify the person.',
                },
                {
                    title: 'Stay Safe Online',
                    description: 'Never send money or share financial information with anyone you meet online.',
                },
            ],
            emergencyContacts: {
                helpline: '+91-1800-XXX-XXXX',
                email: 'safety@matrimonial.com',
                reportUrl: '/report',
            },
        };
    }
    async getBlockedUsers(userId) {
        return this.prisma.blockedUser.findMany({
            where: { blockerId: userId },
            include: {
                blocked: {
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
        });
    }
    async getUserReports(userId) {
        const reports = await this.prisma.report.findMany({
            where: { reporterId: userId },
            orderBy: { createdAt: 'desc' },
        });
        const reportsWithUsers = await Promise.all(reports.map(async (report) => {
            const reportedUser = await this.prisma.user.findUnique({
                where: { id: report.reportedUserId },
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
            });
            return {
                ...report,
                reportedUser,
            };
        }));
        return reportsWithUsers;
    }
    async getSafetyStats(userId) {
        const [reportsMade, blockedCount, reportsReceived] = await Promise.all([
            this.prisma.report.count({ where: { reporterId: userId } }),
            this.prisma.blockedUser.count({ where: { blockerId: userId } }),
            this.prisma.report.count({ where: { reportedUserId: userId } }),
        ]);
        return {
            reportsMade,
            blockedCount,
            reportsReceived,
            safetyScore: this.calculateSafetyScore(reportsReceived),
        };
    }
    calculateSafetyScore(reportsReceived) {
        if (reportsReceived === 0)
            return 100;
        if (reportsReceived === 1)
            return 80;
        if (reportsReceived === 2)
            return 60;
        if (reportsReceived === 3)
            return 40;
        return Math.max(0, 100 - reportsReceived * 20);
    }
};
exports.SafetyService = SafetyService;
exports.SafetyService = SafetyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], SafetyService);
//# sourceMappingURL=safety.service.js.map