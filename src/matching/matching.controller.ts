import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('matching')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private matchingService: MatchingService) {}

  @Get('score/:userId')
  async getMatchScore(@CurrentUser() user: any, @Param('userId') matchedUserId: string) {
    return this.matchingService.calculateMatchScore(user.id, matchedUserId);
  }

  @Get('scores')
  async getUserMatchScores(
    @CurrentUser() user: any,
    @Query('limit') limit: string = '20',
  ) {
    return this.matchingService.getUserMatchScores(user.id, parseInt(limit));
  }

  @Get('reverse-matches')
  async getReverseMatches(
    @CurrentUser() user: any,
    @Query('limit') limit: string = '20',
  ) {
    return this.matchingService.getReverseMatches(user.id, parseInt(limit));
  }
}

