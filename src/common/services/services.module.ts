import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { PushService } from './push.service';
import { NotificationGatewayService } from './notification-gateway.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EmailService, SmsService, PushService, NotificationGatewayService],
  exports: [EmailService, SmsService, PushService, NotificationGatewayService],
})
export class ServicesModule {}

