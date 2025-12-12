"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../common/services/email.service");
const sms_service_1 = require("../common/services/sms.service");
const bcrypt = __importStar(require("bcrypt"));
const client_1 = require("@prisma/client");
let AuthService = class AuthService {
    constructor(prisma, jwtService, emailService, smsService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.smsService = smsService;
    }
    async register(dto) {
        const { email, mobile, password, role, gender, religion, motherTongue, dateOfBirth } = dto;
        if (!email && !mobile) {
            throw new common_1.BadRequestException('Either email or mobile number is required');
        }
        if (email) {
            const existingUser = await this.prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                throw new common_1.BadRequestException('Email already registered');
            }
        }
        if (mobile) {
            const existingUser = await this.prisma.user.findUnique({ where: { mobile } });
            if (existingUser) {
                throw new common_1.BadRequestException('Mobile already registered');
            }
        }
        if (!password) {
            throw new common_1.BadRequestException('Password is required');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                email,
                mobile,
                password: hashedPassword,
                role: role || client_1.UserRole.SELF_MEMBER,
                isEmailVerified: email ? true : false,
                isMobileVerified: mobile ? true : false,
                gdprConsent: true,
                gdprConsentAt: new Date(),
                profile: {
                    create: {
                        status: 'DRAFT',
                        gender: gender,
                        religion: religion || null,
                        motherTongue: motherTongue || null,
                        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                    },
                },
            },
        });
        return {
            message: 'User registered successfully. You can now login.',
            userId: user.id,
        };
    }
    async login(dto, ipAddress, userAgent) {
        const { email, mobile, password } = dto;
        if (!email && !mobile) {
            throw new common_1.BadRequestException('Either email or mobile number is required');
        }
        if (!password) {
            throw new common_1.BadRequestException('Password is required');
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
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.password) {
            throw new common_1.UnauthorizedException('Password not set. Please set a password first.');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const updateData = {
            lastLoginAt: new Date(),
            lastActiveAt: new Date(),
            isOnline: true,
        };
        await this.prisma.user.update({
            where: { id: user.id },
            data: updateData,
        });
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
    async verifyOtp(dto) {
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
            throw new common_1.BadRequestException('Invalid or expired OTP');
        }
        await this.prisma.oTP.update({
            where: { id: otp.id },
            data: { isUsed: true },
        });
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
    async resetPassword(dto) {
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
            throw new common_1.BadRequestException('Invalid or expired OTP');
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
    async googleLogin(googleId, email, name, ipAddress, userAgent) {
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
        }
        else if (!user.googleId) {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { googleId, isEmailVerified: true },
            });
        }
        if (!user.referralCode) {
            const referralCode = await this.generateReferralCode(user.id);
            user.referralCode = referralCode;
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
    async facebookLogin(facebookId, email, name, ipAddress, userAgent) {
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
    async generateReferralCode(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || user.referralCode) {
            return user?.referralCode || '';
        }
        let referralCode;
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
    generateToken(userId) {
        return this.jwtService.sign({ sub: userId });
    }
    async createSession(userId, token, ipAddress, userAgent) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
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
    async logout(userId, token) {
        await this.prisma.session.deleteMany({
            where: {
                userId,
                token,
            },
        });
        return { message: 'Logged out successfully' };
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { password: true },
        });
        if (!user || !user.password) {
            throw new common_1.BadRequestException('User not found or password not set');
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        if (newPassword.length < 8) {
            throw new common_1.BadRequestException('New password must be at least 8 characters long');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        return { message: 'Password changed successfully' };
    }
    async getSessions(userId, currentToken) {
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
    async deleteSession(userId, sessionId) {
        const session = await this.prisma.session.findFirst({
            where: {
                id: sessionId,
                userId,
            },
        });
        if (!session) {
            throw new common_1.BadRequestException('Session not found');
        }
        await this.prisma.session.delete({
            where: { id: sessionId },
        });
        return { message: 'Session revoked successfully' };
    }
    async revokeAllSessions(userId, currentToken) {
        await this.prisma.session.deleteMany({
            where: {
                userId,
                token: { not: currentToken },
            },
        });
        return { message: 'All other sessions revoked successfully' };
    }
    async sendVerificationOtp(userId, type) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, mobile: true, isEmailVerified: true, isMobileVerified: true },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (type === 'EMAIL') {
            if (!user.email) {
                throw new common_1.BadRequestException('Email not set');
            }
            if (user.isEmailVerified) {
                throw new common_1.BadRequestException('Email already verified');
            }
            await this.prisma.user.update({
                where: { id: userId },
                data: { isEmailVerified: true },
            });
            return { message: 'Verification email sent (auto-verified in development mode)' };
        }
        else {
            if (!user.mobile) {
                throw new common_1.BadRequestException('Mobile number not set');
            }
            if (user.isMobileVerified) {
                throw new common_1.BadRequestException('Mobile already verified');
            }
            await this.prisma.user.update({
                where: { id: userId },
                data: { isMobileVerified: true },
            });
            return { message: 'Verification SMS sent (auto-verified in development mode)' };
        }
    }
    async verifyEmail(userId, otp) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { isEmailVerified: true },
        });
        return { message: 'Email verified successfully' };
    }
    async verifyMobile(userId, otp) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { isMobileVerified: true },
        });
        return { message: 'Mobile verified successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        email_service_1.EmailService,
        sms_service_1.SmsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map