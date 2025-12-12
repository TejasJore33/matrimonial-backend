import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER', '');

    // Validate Twilio credentials - accountSid must start with 'AC'
    if (accountSid && authToken && accountSid.trim().startsWith('AC')) {
      try {
        this.client = twilio(accountSid.trim(), authToken.trim());
        this.logger.log('Twilio SMS service initialized successfully');
      } catch (error) {
        this.logger.warn('Failed to initialize Twilio client. SMS sending will be disabled.', error);
        this.client = null;
      }
    } else {
      this.logger.warn('Twilio credentials not configured or invalid. SMS sending will be disabled.');
      this.client = null;
    }
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    if (!this.client || !this.fromNumber) {
      this.logger.warn(`SMS not sent to ${to}: Twilio not configured`);
      return false;
    }

    try {
      // Remove any non-digit characters except +
      const cleanTo = to.replace(/[^\d+]/g, '');
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: cleanTo,
      });

      this.logger.log(`SMS sent successfully to ${to}: ${result.sid}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}:`, error);
      return false;
    }
  }

  async sendOtpSms(mobile: string, code: string): Promise<boolean> {
    const message = `Your OTP verification code is ${code}. This code will expire in 10 minutes. Do not share this code with anyone.`;
    return this.sendSms(mobile, message);
  }

  async sendNotificationSms(mobile: string, message: string): Promise<boolean> {
    return this.sendSms(mobile, message);
  }
}

