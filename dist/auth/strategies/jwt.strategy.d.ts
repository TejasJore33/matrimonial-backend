import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: any): Promise<{
        email: string;
        mobile: string;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        isEmailVerified: boolean;
        isMobileVerified: boolean;
    }>;
}
export {};
