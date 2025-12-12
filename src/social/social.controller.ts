import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private socialService: SocialService) {}

  @Get('share-link')
  async generateShareLink(@CurrentUser() user: any) {
    return this.socialService.generateProfileShareLink(user.id);
  }

  @Get('qr-code')
  async generateQRCode(@CurrentUser() user: any) {
    return this.socialService.generateProfileQRCode(user.id);
  }

  @Get('print')
  async getProfileForPrint(@CurrentUser() user: any) {
    return this.socialService.getProfileForPrint(user.id);
  }

  @Post('share/:platform')
  async shareToSocialMedia(@CurrentUser() user: any, @Param('platform') platform: string) {
    return this.socialService.shareToSocialMedia(user.id, platform);
  }
}

