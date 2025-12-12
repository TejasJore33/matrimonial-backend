import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ComparisonService } from './comparison.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('comparison')
@UseGuards(JwtAuthGuard)
export class ComparisonController {
  constructor(private comparisonService: ComparisonService) {}

  @Post()
  async compareProfiles(
    @CurrentUser() user: any,
    @Body() body: { profileIds: string[]; includeMatchScores?: boolean },
  ) {
    if (body.includeMatchScores) {
      return this.comparisonService.getComparisonWithMatchScores(user.id, body.profileIds);
    }
    return this.comparisonService.compareProfiles(user.id, body.profileIds);
  }

  @Get('history')
  async getComparisonHistory(@CurrentUser() user: any) {
    return this.comparisonService.getComparisonHistory(user.id);
  }

  @Get('saved')
  async getSavedComparisons(@CurrentUser() user: any) {
    return this.comparisonService.getSavedComparisons(user.id);
  }

  @Delete(':profileId')
  async deleteComparison(@CurrentUser() user: any, @Param('profileId') profileId: string) {
    return this.comparisonService.deleteComparison(user.id, profileId);
  }
}

