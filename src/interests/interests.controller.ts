import { Controller, Get, Post, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { InterestsService } from './interests.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('interests')
@UseGuards(JwtAuthGuard)
export class InterestsController {
  constructor(private interestsService: InterestsService) {}

  @Post()
  async sendInterest(
    @CurrentUser() user: any,
    @Body() body: { toUserId: string; message?: string },
  ) {
    return this.interestsService.sendInterest(user.id, body.toUserId, body.message);
  }

  @Put(':id/accept')
  async acceptInterest(@CurrentUser() user: any, @Param('id') id: string) {
    return this.interestsService.acceptInterest(user.id, id);
  }

  @Put(':id/reject')
  async rejectInterest(@CurrentUser() user: any, @Param('id') id: string) {
    return this.interestsService.rejectInterest(user.id, id);
  }

  @Get('received')
  async getReceivedInterests(@CurrentUser() user: any) {
    return this.interestsService.getReceivedInterests(user.id);
  }

  @Get('sent')
  async getSentInterests(@CurrentUser() user: any) {
    return this.interestsService.getSentInterests(user.id);
  }

  @Get('matches')
  async getMatches(@CurrentUser() user: any) {
    return this.interestsService.getMatches(user.id);
  }

  @Put(':id/withdraw')
  async withdrawInterest(@CurrentUser() user: any, @Param('id') id: string) {
    return this.interestsService.withdrawInterest(user.id, id);
  }

  @Post('bulk')
  async sendBulkInterests(
    @CurrentUser() user: any,
    @Body() body: { userIds: string[]; message?: string },
  ) {
    return this.interestsService.sendBulkInterests(user.id, body.userIds, body.message);
  }

  @Get('history')
  async getInterestHistory(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('type') type?: 'sent' | 'received',
  ) {
    return this.interestsService.getInterestHistory(user.id, { status, type });
  }

  @Get('reminders')
  async getPendingInterestsReminder(@CurrentUser() user: any) {
    return this.interestsService.getPendingInterestsReminder(user.id);
  }

  @Get('stats')
  async getInterestStats(@CurrentUser() user: any) {
    return this.interestsService.getInterestStats(user.id);
  }
}

