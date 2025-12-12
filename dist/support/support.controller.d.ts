import { SupportService } from './support.service';
export declare class SupportController {
    private supportService;
    constructor(supportService: SupportService);
    createSupportTicket(user: any, body: {
        subject: string;
        message: string;
        category?: string;
        priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    }): Promise<{
        message: string;
        userId: string;
        subject: string;
        category: string;
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        isPremium: boolean;
        createdAt: Date;
        ticketId: string;
    }>;
    getUserTickets(user: any): Promise<{
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
