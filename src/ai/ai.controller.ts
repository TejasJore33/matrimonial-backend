import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('analyze-photo')
  async analyzePhotoQuality(@Body() body: { photoUrl: string }) {
    return this.aiService.analyzePhotoQuality(body.photoUrl);
  }

  @Post('auto-tag/:profileId')
  async autoTagProfile(@Param('profileId') profileId: string) {
    return this.aiService.autoTagProfile(profileId);
  }

  @Get('fraud-check/:userId')
  @UseGuards(AdminGuard)
  async detectFraudulentProfile(@Param('userId') userId: string) {
    return this.aiService.detectFraudulentProfile(userId);
  }

  @Get('recommendations')
  async getProfileRecommendations(@CurrentUser() user: any) {
    return this.aiService.getProfileRecommendations(user.id);
  }
}

