import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class SupportService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    createSupportTicket(userId: string, subject: string, message: string, category?: string, priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'): Promise<{
        message: string;
        userId: string;
        subject: string;
        category: string;
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        isPremium: boolean;
        createdAt: Date;
        ticketId: string;
    }>;
    getUserTickets(userId: string): Promise<{
        ticketId: any;
        subject: string;
        message: string;
        category: any;
        priority: any;
        status: any;
        createdAt: Date;
    }[]>;
    getFAQ(): Promise<{
        categories: {
            category: string;
            questions: {
                question: string;
                answer: string;
            }[];
        }[];
    }>;
    getContactInfo(): Promise<{
        email: string;
        phone: string;
        hours: string;
        address: string;
        socialMedia: {
            facebook: string;
            twitter: string;
            instagram: string;
        };
    }>;
}
