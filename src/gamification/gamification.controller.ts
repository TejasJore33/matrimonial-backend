import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private gamificationService: GamificationService) {}

  @Get('achievements')
  async getUserAchievements(@CurrentUser() user: any) {
    return this.gamificationService.getUserAchievements(user.id);
  }

  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: string) {
    return this.gamificationService.getLeaderboard(limit ? parseInt(limit) : 10);
  }

  @Get('rank')
  async getUserRank(@CurrentUser() user: any) {
    return this.gamificationService.getUserRank(user.id);
  }
}

