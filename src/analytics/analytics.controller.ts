import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('my')
  async getUserAnalytics(
    @CurrentUser() user: any,
    @Query('period') period?: '7d' | '30d' | '90d' | 'all',
  ) {
    if (period) {
      return this.analyticsService.getDetailedAnalytics(user.id, period);
    }
    return this.analyticsService.getUserAnalytics(user.id);
  }

  @Get('detailed')
  async getDetailedAnalytics(
    @CurrentUser() user: any,
    @Query('period') period: '7d' | '30d' | '90d' | 'all' = '30d',
  ) {
    return this.analyticsService.getDetailedAnalytics(user.id, period);
  }
}

