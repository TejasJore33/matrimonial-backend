import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('referral')
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private referralService: ReferralService) {}

  @Get('code')
  async getMyReferralCode(@CurrentUser() user: any) {
    return this.referralService.getMyReferralCode(user.id);
  }

  @Post('apply')
  async applyReferralCode(@CurrentUser() user: any, @Body() body: { referralCode: string }) {
    return this.referralService.applyReferralCode(user.id, body.referralCode);
  }

  @Get('stats')
  async getReferralStats(@CurrentUser() user: any) {
    return this.referralService.getReferralStats(user.id);
  }
}

