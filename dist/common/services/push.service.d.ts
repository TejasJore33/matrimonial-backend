import { ConfigService } from '@nestjs/config';
export declare class PushService {
    private configService;
    private readonly logger;
    private initialized;
    constructor(configService: ConfigService);
    private initializeFirebase;
    sendPushNotification(fcmToken: string, title: string, body: string, data?: Record<string, any>): Promise<boolean>;
    sendPushNotificationToMultiple(fcmTokens: string[], title: string, body: string, data?: Record<string, any>): Promise<{
        successCount: number;
        failureCount: number;
    }>;
    private convertDataToStrings;
}
