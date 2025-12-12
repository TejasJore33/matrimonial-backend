import { Controller, Get, Put, Delete, Param, Body, UseGuards, Query, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private prisma: PrismaService,
  ) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.notificationsService.getUserNotifications(user.id, parseInt(page), parseInt(limit));
  }

  @Put('read')
  async markAsRead(@CurrentUser() user: any, @Body() body: { notificationIds: string[] }) {
    return this.notificationsService.markAsRead(user.id, body.notificationIds);
  }

  @Put('read-all')
  async markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  async deleteNotification(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.deleteNotification(user.id, id);
  }

  @Post('fcm-token')
  async updateFcmToken(@CurrentUser() user: any, @Body() body: { fcmToken: string }) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { fcmToken: body.fcmToken },
    });
    return { message: 'FCM token updated successfully' };
  }

  @Get('preferences')
  async getPreferences(@CurrentUser() user: any) {
    return this.notificationsService.getNotificationPreferences(user.id);
  }

  @Put('preferences')
  async updatePreferences(@CurrentUser() user: any, @Body() preferences: any) {
    return this.notificationsService.updateNotificationPreferences(user.id, preferences);
  }

  @Get('history')
  async getHistory(
    @CurrentUser() user: any,
    @Query('type') type?: string,
    @Query('read') read?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getNotificationHistory(user.id, {
      type,
      read: read === 'true' ? true : read === 'false' ? false : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }
}

