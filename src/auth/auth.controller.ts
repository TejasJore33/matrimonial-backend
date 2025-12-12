import { Controller, Post, Body, Get, UseGuards, Req, Delete, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, VerifyOtpDto, ResetPasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.authService.login(dto, ipAddress, userAgent);
  }

  // OTP functionality disabled - uncomment when email/SMS services are configured
  // @Post('verify-otp')
  // async verifyOtp(@Body() dto: VerifyOtpDto) {
  //   return this.authService.verifyOtp(dto);
  // }

  // @Post('send-otp')
  // async sendOtp(@Body() body: { identifier: string; type: 'EMAIL' | 'MOBILE' }) {
  //   return this.authService.sendOtp(body.identifier, body.type);
  // }

  // @Post('reset-password')
  // async resetPassword(@Body() dto: ResetPasswordDto) {
  //   return this.authService.resetPassword(dto);
  // }

  @Post('google')
  async googleLogin(@Body() body: { googleId: string; email: string; name: string }, @Req() req: any) {
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.authService.googleLogin(body.googleId, body.email, body.name, ipAddress, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: any, @Req() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(user.id, token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    return { user };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@CurrentUser() user: any, @Req() req: any) {
    const currentToken = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.getSessions(user.id, currentToken);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  async deleteSession(@CurrentUser() user: any, @Param('sessionId') sessionId: string) {
    return this.authService.deleteSession(user.id, sessionId);
  }

  @Post('sessions/revoke-all')
  @UseGuards(JwtAuthGuard)
  async revokeAllSessions(@CurrentUser() user: any, @Req() req: any) {
    const currentToken = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.revokeAllSessions(user.id, currentToken);
  }

  @Post('send-verification-otp')
  @UseGuards(JwtAuthGuard)
  async sendVerificationOtp(
    @CurrentUser() user: any,
    @Body() body: { type: 'EMAIL' | 'MOBILE' },
  ) {
    return this.authService.sendVerificationOtp(user.id, body.type);
  }

  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  async verifyEmail(@CurrentUser() user: any, @Body() body: { otp: string }) {
    return this.authService.verifyEmail(user.id, body.otp);
  }

  @Post('verify-mobile')
  @UseGuards(JwtAuthGuard)
  async verifyMobile(@CurrentUser() user: any, @Body() body: { otp: string }) {
    return this.authService.verifyMobile(user.id, body.otp);
  }
}

