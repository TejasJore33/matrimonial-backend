import { Controller, Get, Post, Put, Body, Param, UseGuards, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('verification')
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 2))
  async submitVerification(
    @CurrentUser() user: any,
    @Body() body: { idType: string; idNumber?: string },
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const idPhoto = files?.[0];
    const selfie = files?.[1];
    return this.verificationService.submitVerification(user.id, {
      idType: body.idType,
      idNumber: body.idNumber,
      idPhoto,
      selfie,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getVerification(@CurrentUser() user: any) {
    return this.verificationService.getVerification(user.id);
  }

  @Put(':userId/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async approveVerification(@CurrentUser() user: any, @Param('userId') userId: string) {
    return this.verificationService.approveVerification(userId, user.id);
  }

  @Put(':userId/reject')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async rejectVerification(
    @CurrentUser() user: any,
    @Param('userId') userId: string,
    @Body() body?: { reason?: string },
  ) {
    return this.verificationService.rejectVerification(userId, user.id, body?.reason);
  }

  @Post('phone')
  @UseGuards(JwtAuthGuard)
  async verifyPhone(@CurrentUser() user: any, @Body() body: { otp: string }) {
    return this.verificationService.verifyPhone(user.id, body.otp);
  }

  @Post('email')
  @UseGuards(JwtAuthGuard)
  async verifyEmail(@CurrentUser() user: any, @Body() body: { otp: string }) {
    return this.verificationService.verifyEmail(user.id, body.otp);
  }
}

