import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { FeaturesService } from './features.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('features')
@UseGuards(JwtAuthGuard)
export class FeaturesController {
  constructor(private featuresService: FeaturesService) {}

  @Post('daily-login-reward')
  async checkDailyLoginReward(@CurrentUser() user: any) {
    return this.featuresService.checkDailyLoginReward(user.id);
  }

  @Get('activity-feed')
  async getActivityFeed(
    @CurrentUser() user: any,
    @Query('limit') limit: string = '20',
  ) {
    return this.featuresService.getActivityFeed(user.id, parseInt(limit));
  }

  @Get('leaderboard')
  async getLeaderboard(
    @Query('category') category: string = 'MOST_ACTIVE',
    @Query('period') period: string = 'WEEKLY',
    @Query('limit') limit: string = '100',
  ) {
    return this.featuresService.getLeaderboard(category, period, parseInt(limit));
  }
}

