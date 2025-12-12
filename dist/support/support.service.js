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
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const subscription_constants_1 = require("../common/constants/subscription.constants");
let SupportService = class SupportService {
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async createSupportTicket(userId, subject, message, category = 'GENERAL', priority = 'MEDIUM') {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
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
        const hasPaidPlan = user?.subscriptions.length > 0;
        const finalPriority = hasPaidPlan && priority === 'MEDIUM' ? 'HIGH' : priority;
        const admins = await this.prisma.user.findMany({
            where: { role: 'ADMIN' },
        });
        const ticketData = {
            userId,
            subject,
            message,
            category,
            priority: finalPriority,
            isPremium: hasPaidPlan,
            createdAt: new Date(),
        };
        for (const admin of admins) {
            await this.notificationsService.create(admin.id, 'SUPPORT', `Support Ticket: ${subject}`, `Priority: ${finalPriority} | Category: ${category}\n${message}`, ticketData, { sendEmail: true, sendPush: true, sendRealTime: true });
        }
        return {
            ticketId: `TICKET-${Date.now()}`,
            ...ticketData,
            message: 'Support ticket created successfully. Our team will respond soon.',
        };
    }
    async getUserTickets(userId) {
        const notifications = await this.prisma.notification.findMany({
            where: {
                userId,
                type: 'SUPPORT',
            },
            orderBy: { createdAt: 'desc' },
        });
        return notifications.map((notif) => {
            const metadata = notif.metadata;
            return {
                ticketId: metadata?.ticketId || notif.id,
                subject: notif.title.replace('Support Ticket: ', ''),
                message: notif.message,
                category: metadata?.category || 'GENERAL',
                priority: metadata?.priority || 'MEDIUM',
                status: metadata?.status || 'OPEN',
                createdAt: notif.createdAt,
            };
        });
    }
    async getFAQ() {
        return {
            categories: [
                {
                    category: 'Account & Profile',
                    questions: [
                        {
                            question: 'How do I create a profile?',
                            answer: 'Click on "Create Profile" and fill in your details step by step. Make sure to add photos and complete all sections for better visibility.',
                        },
                        {
                            question: 'How do I verify my profile?',
                            answer: 'Go to Verification section and upload your ID proof and a selfie. Our team will verify within 24-48 hours.',
                        },
                        {
                            question: 'Can I hide my profile from search?',
                            answer: 'Yes, go to Privacy Settings and enable "Hide from Search" option.',
                        },
                    ],
                },
                {
                    category: 'Matching & Interests',
                    questions: [
                        {
                            question: 'How do I send an interest?',
                            answer: 'Browse profiles and click "Send Interest" on profiles you like. Free users can send 5 interests per day.',
                        },
                        {
                            question: 'What happens when someone accepts my interest?',
                            answer: 'You will be notified and a chat will be created automatically. You can then start messaging.',
                        },
                        {
                            question: 'Can I withdraw an interest?',
                            answer: 'Yes, go to "Sent Interests" and click "Withdraw" on any pending interest.',
                        },
                    ],
                },
                {
                    category: 'Premium Features',
                    questions: [
                        {
                            question: 'What are the benefits of Premium?',
                            answer: 'Premium members get unlimited interests, profile highlighting, advanced search filters, and priority customer support.',
                        },
                        {
                            question: 'How do I upgrade to Premium?',
                            answer: 'Go to Payments & Subscriptions page and select a Premium plan. Payment can be made via Razorpay.',
                        },
                        {
                            question: 'Can I cancel my subscription?',
                            answer: 'Yes, you can cancel anytime from the Subscriptions page. Your premium features will remain active until the end of the billing period.',
                        },
                    ],
                },
                {
                    category: 'Safety & Privacy',
                    questions: [
                        {
                            question: 'How do I report a user?',
                            answer: 'Go to the user\'s profile and click "Report". Select the reason and provide details. Our team will review within 24 hours.',
                        },
                        {
                            question: 'How do I block a user?',
                            answer: 'Go to the user\'s profile and click "Block". Blocked users cannot contact you or see your profile.',
                        },
                        {
                            question: 'Is my data safe?',
                            answer: 'Yes, we follow strict data protection policies and GDPR compliance. Your personal information is encrypted and secure.',
                        },
                    ],
                },
            ],
        };
    }
    async getContactInfo() {
        return {
            email: 'support@matrimonial.com',
            phone: '+91-1800-XXX-XXXX',
            hours: 'Monday - Saturday, 9 AM - 6 PM IST',
            address: '123 Matrimonial Street, City, State, PIN',
            socialMedia: {
                facebook: 'https://facebook.com/matrimonial',
                twitter: 'https://twitter.com/matrimonial',
                instagram: 'https://instagram.com/matrimonial',
            },
        };
    }
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], SupportService);
//# sourceMappingURL=support.service.js.map