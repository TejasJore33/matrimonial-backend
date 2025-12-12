import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private readonly logger;
    private transporter;
    constructor(configService: ConfigService);
    sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean>;
    sendOtpEmail(email: string, code: string): Promise<boolean>;
    sendNotificationEmail(email: string, title: string, message: string, type?: string): Promise<boolean>;
    private stripHtml;
}
