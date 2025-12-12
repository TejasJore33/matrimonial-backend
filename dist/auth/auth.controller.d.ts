import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        message: string;
        userId: string;
    }>;
    login(dto: LoginDto, req: any): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            mobile: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    googleLogin(body: {
        googleId: string;
        email: string;
        name: string;
    }, req: any): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            mobile: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    logout(user: any, req: any): Promise<{
        message: string;
    }>;
    getMe(user: any): Promise<{
        user: any;
    }>;
    changePassword(user: any, body: {
        currentPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
    getSessions(user: any, req: any): Promise<{
        id: string;
        isCurrent: boolean;
        ipAddress: string;
        userAgent: string;
        createdAt: Date;
        expiresAt: Date;
    }[]>;
    deleteSession(user: any, sessionId: string): Promise<{
        message: string;
    }>;
    revokeAllSessions(user: any, req: any): Promise<{
        message: string;
    }>;
    sendVerificationOtp(user: any, body: {
        type: 'EMAIL' | 'MOBILE';
    }): Promise<{
        message: string;
    }>;
    verifyEmail(user: any, body: {
        otp: string;
    }): Promise<{
        message: string;
    }>;
    verifyMobile(user: any, body: {
        otp: string;
    }): Promise<{
        message: string;
    }>;
}
