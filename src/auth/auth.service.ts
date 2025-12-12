import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import { SmsService } from '../common/services/sms.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto, VerifyOtpDto, ResetPasswordDto } from './dto/auth.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  async register(dto: RegisterDto) {
    const { email, mobile, password, role, gender, religion, motherTongue, dateOfBirth } = dto;

    // Validate that at least email or mobile is provided
    if (!email && !mobile) {
      throw new BadRequestException('Either email or mobile number is required');
    }

    // Check if user exists
    if (email) {
      const existingUser = await this.prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new BadRequestException('Email already registered');
      }
    }

    if (mobile) {
      const existingUser = await this.prisma.user.findUnique({ where: { mobile } });
      if (existingUser) {
        throw new BadRequestException('Mobile already registered');
      }
    }

    // Validate password is provided
    if (!password) {
      throw new BadRequestException('Password is required');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with profile
    const user = await this.prisma.user.create({
      data: {
        email,
        mobile,
        password: hashedPassword,
        role: (role as UserRole) || UserRole.SELF_MEMBER,
        // Auto-verify email/mobile for now (OTP disabled)
        isEmailVerified: email ? true : false,
        isMobileVerified: mobile ? true : false,
        gdprConsent: true,
        gdprConsentAt: new Date(),
        profile: {
          create: {
            status: 'DRAFT',
            gender: gender as any,
            religion: religion || null,
            motherTongue: motherTongue || null,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          },
        },
      },
    });

    // OTP sending disabled for now - uncomment when email/SMS services are configured
    // // Generate OTP
    // if (email) {
    //   await this.sendEmailOtp(email);
    // } else if (mobile) {
    //   await this.sendMobileOtp(mobile);
    // }

    return {
      message: 'User registered successfully. You can now login.',
      userId: user.id,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { email, mobile, password } = dto;

    // Validate that at least email or mobile is provided
    if (!email && !mobile) {
      throw new BadRequestException('Either email or mobile number is required');
    }

    // Password is required for login
    if (!password) {
      throw new BadRequestException('Password is required');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          mobile ? { mobile } : {},
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Password is required - check if user has a password
    if (!user.password) {
      throw new UnauthorizedException('Password not set. Please set a password first.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login and check daily reward
    const updateData: any = {
      lastLoginAt: new Date(),
      lastActiveAt: new Date(),
      isOnline: true,
    };

    await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Check daily login reward (async, don't wait)
    // This will be handled by FeaturesService when user accesses the app

    const token = this.generateToken(user.id);
    await this.createSession(user.id, token, undefined, undefined);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { identifier, code, type } = dto;

    const otp = await this.prisma.oTP.findFirst({
      where: {
        identifier,
        code,
        type,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Mark OTP as used
    await this.prisma.oTP.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    // Update user verification status
    const updateData = type === 'EMAIL' 
      ? { isEmailVerified: true }
      : { isMobileVerified: true };

    const whereClause = type === 'EMAIL' 
      ? { email: identifier }
      : { mobile: identifier };

    const user = await this.prisma.user.update({
      where: whereClause,
      data: updateData,
    });

    const token = this.generateToken(user.id);
    await this.createSession(user.id, token);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    };
  }

  // OTP sending disabled - uncomment when email/SMS services are configured
  // async sendOtp(identifier: string, type: 'EMAIL' | 'MOBILE') {
  //   if (type === 'EMAIL') {
  //     return this.sendEmailOtp(identifier);
  //   } else {
  //     return this.sendMobileOtp(identifier);
  //   }
  // }

  // OTP methods commented out - uncomment when email/SMS services are configured
  // private async sendEmailOtp(email: string) {
  //   const code = Math.floor(100000 + Math.random() * 900000).toString();
  //   const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  //   await this.prisma.oTP.create({
  //     data: {
  //       identifier: email,
  //       code,
  //       type: 'EMAIL',
  //       expiresAt,
  //     },
  //   });

  //   // Send email via nodemailer
  //   await this.emailService.sendOtpEmail(email, code);
  //   return { message: 'OTP sent to email' };
  // }

  // private async sendMobileOtp(mobile: string) {
  //   const code = Math.floor(100000 + Math.random() * 900000).toString();
  //   const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  //   await this.prisma.oTP.create({
  //     data: {
  //       identifier: mobile,
  //       code,
  //       type: 'MOBILE',
  //       expiresAt,
  //     },
  //   });

  //   // Send SMS via Twilio
  //   await this.smsService.sendOtpSms(mobile, code);
  //   return { message: 'OTP sent to mobile' };
  // }

  async resetPassword(dto: ResetPasswordDto) {
    const { identifier, code, newPassword } = dto;

    const otp = await this.prisma.oTP.findFirst({
      where: {
        identifier,
        code,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const whereClause = otp.type === 'EMAIL' 
      ? { email: identifier }
      : { mobile: identifier };

    const user = await this.prisma.user.update({
      where: whereClause,
      data: { password: hashedPassword },
    });

    await this.prisma.oTP.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    return { message: 'Password reset successfully' };
  }

  async googleLogin(googleId: string, email: string, name: string, ipAddress?: string, userAgent?: string) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email },
        ],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          googleId,
          email,
          isEmailVerified: true,
          gdprConsent: true,
          gdprConsentAt: new Date(),
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId, isEmailVerified: true },
      });
    }

    // Generate referral code if doesn't exist
    if (!user.referralCode) {
      const referralCode = await this.generateReferralCode(user.id);
      user.referralCode = referralCode;
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), isOnline: true },
    });

    const token = this.generateToken(user.id);
    await this.createSession(user.id, token, ipAddress, userAgent);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    };
  }

  async facebookLogin(facebookId: string, email: string, name: string, ipAddress?: string, userAgent?: string) {
    // Similar to Google login - Facebook integration
    // For now, use email-based lookup
    let user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          isEmailVerified: true,
          gdprConsent: true,
          gdprConsentAt: new Date(),
        },
      });
    }

    if (!user.referralCode) {
      await this.generateReferralCode(user.id);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), isOnline: true },
    });

    const token = this.generateToken(user.id);
    await this.createSession(user.id, token, ipAddress, userAgent);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    };
  }

  private async generateReferralCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.referralCode) {
      return user?.referralCode || '';
    }

    let referralCode: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      referralCode = `${user.email?.substring(0, 3).toUpperCase() || 'USR'}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const existing = await this.prisma.user.findUnique({
        where: { referralCode },
      });

      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      referralCode = `REF${userId.substring(0, 8).toUpperCase()}`;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { referralCode },
    });

    return referralCode;
  }

  private generateToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }

  private async createSession(userId: string, token: string, ipAddress?: string, userAgent?: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
  }

  async logout(userId: string, token: string) {
    await this.prisma.session.deleteMany({
      where: {
        userId,
        token,
      },
    });
    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user || !user.password) {
      throw new BadRequestException('User not found or password not set');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters long');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async getSessions(userId: string, currentToken: string) {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((session) => ({
      id: session.id,
      isCurrent: session.token === currentToken,
      ipAddress: session.ipAddress || 'Unknown',
      userAgent: session.userAgent || 'Unknown',
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }));
  }

  async deleteSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    await this.prisma.session.delete({
      where: { id: sessionId },
    });

    return { message: 'Session revoked successfully' };
  }

  async revokeAllSessions(userId: string, currentToken: string) {
    // Delete all sessions except the current one
    await this.prisma.session.deleteMany({
      where: {
        userId,
        token: { not: currentToken },
      },
    });

    return { message: 'All other sessions revoked successfully' };
  }

  async sendVerificationOtp(userId: string, type: 'EMAIL' | 'MOBILE') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, mobile: true, isEmailVerified: true, isMobileVerified: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (type === 'EMAIL') {
      if (!user.email) {
        throw new BadRequestException('Email not set');
      }
      if (user.isEmailVerified) {
        throw new BadRequestException('Email already verified');
      }
      // For now, auto-verify (when email service is configured, send OTP)
      await this.prisma.user.update({
        where: { id: userId },
        data: { isEmailVerified: true },
      });
      return { message: 'Verification email sent (auto-verified in development mode)' };
    } else {
      if (!user.mobile) {
        throw new BadRequestException('Mobile number not set');
      }
      if (user.isMobileVerified) {
        throw new BadRequestException('Mobile already verified');
      }
      // For now, auto-verify (when SMS service is configured, send OTP)
      await this.prisma.user.update({
        where: { id: userId },
        data: { isMobileVerified: true },
      });
      return { message: 'Verification SMS sent (auto-verified in development mode)' };
    }
  }

  async verifyEmail(userId: string, otp: string) {
    // In production, verify OTP from database
    // For now, auto-verify
    await this.prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });
    return { message: 'Email verified successfully' };
  }

  async verifyMobile(userId: string, otp: string) {
    // In production, verify OTP from database
    // For now, auto-verify
    await this.prisma.user.update({
      where: { id: userId },
      data: { isMobileVerified: true },
    });
    return { message: 'Mobile verified successfully' };
  }
}

