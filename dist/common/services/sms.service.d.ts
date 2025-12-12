import { ConfigService } from '@nestjs/config';
export declare class SmsService {
    private configService;
    private readonly logger;
    private client;
    private fromNumber;
    constructor(configService: ConfigService);
    sendSms(to: string, message: string): Promise<boolean>;
    sendOtpSms(mobile: string, code: string): Promise<boolean>;
    sendNotificationSms(mobile: string, message: string): Promise<boolean>;
}
