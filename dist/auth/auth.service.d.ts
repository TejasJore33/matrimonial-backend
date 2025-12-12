import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import { SmsService } from '../common/services/sms.service';
import { RegisterDto, LoginDto, VerifyOtpDto, ResetPasswordDto } from './dto/auth.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    private emailService;
    private smsService;
    constructor(prisma: PrismaService, jwtService: JwtService, emailService: EmailService, smsService: SmsService);
    register(dto: RegisterDto): Promise<{
        message: string;
        userId: string;
    }>;
    login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            mobile: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            mobile: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    googleLogin(googleId: string, email: string, name: string, ipAddress?: string, userAgent?: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            mobile: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    facebookLogin(facebookId: string, email: string, name: string, ipAddress?: string, userAgent?: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            mobile: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    private generateReferralCode;
    private generateToken;
    private createSession;
    logout(userId: string, token: string): Promise<{
        message: string;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    getSessions(userId: string, currentToken: string): Promise<{
        id: string;
        isCurrent: boolean;
        ipAddress: string;
        userAgent: string;
        createdAt: Date;
        expiresAt: Date;
    }[]>;
    deleteSession(userId: string, sessionId: string): Promise<{
        message: string;
    }>;
    revokeAllSessions(userId: string, currentToken: string): Promise<{
        message: string;
    }>;
    sendVerificationOtp(userId: string, type: 'EMAIL' | 'MOBILE'): Promise<{
        message: string;
    }>;
    verifyEmail(userId: string, otp: string): Promise<{
        message: string;
    }>;
    verifyMobile(userId: string, otp: string): Promise<{
        message: string;
    }>;
}
