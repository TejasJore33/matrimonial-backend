import { Controller, Get, Post, Body, UseGuards, Param, Query } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('safety')
@UseGuards(JwtAuthGuard)
export class SafetyController {
  constructor(private safetyService: SafetyService) {}

  @Post('report')
  async reportUser(
    @CurrentUser() user: any,
    @Body() body: {
      reportedUserId: string;
      type: 'PROFILE' | 'MESSAGE' | 'PHOTO';
      reason: string;
      description?: string;
      messageId?: string;
      photoId?: string;
    },
  ) {
    return this.safetyService.reportUser(
      user.id,
      body.reportedUserId,
      body.type,
      body.reason,
      body.description,
      body.messageId,
      body.photoId,
    );
  }

  @Get('tips')
  async getSafetyTips() {
    return this.safetyService.getSafetyTips();
  }

  @Get('blocked')
  async getBlockedUsers(@CurrentUser() user: any) {
    return this.safetyService.getBlockedUsers(user.id);
  }

  @Get('reports')
  async getUserReports(@CurrentUser() user: any) {
    return this.safetyService.getUserReports(user.id);
  }

  @Get('stats')
  async getSafetyStats(@CurrentUser() user: any) {
    return this.safetyService.getSafetyStats(user.id);
  }
}

