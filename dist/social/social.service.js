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
exports.SocialService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const QRCode = __importStar(require("qrcode"));
let SocialService = class SocialService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateProfileShareLink(userId) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const shareLink = `${baseUrl}/profile/${profile.slug || userId}`;
        return {
            shareLink,
            shortLink: shareLink,
        };
    }
    async generateProfileQRCode(userId) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const profileUrl = `${baseUrl}/profile/${profile.slug || userId}`;
        try {
            const qrCodeDataUrl = await QRCode.toDataURL(profileUrl, {
                width: 300,
                margin: 2,
            });
            return {
                qrCode: qrCodeDataUrl,
                profileUrl,
            };
        }
        catch (error) {
            throw new Error('Failed to generate QR code');
        }
    }
    async getProfileForPrint(userId) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
            include: {
                photos: {
                    where: { isApproved: true },
                    orderBy: { order: 'asc' },
                },
                user: {
                    select: {
                        id: true,
                        email: true,
                        mobile: true,
                        isEmailVerified: true,
                        isMobileVerified: true,
                    },
                },
            },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        return {
            ...profile,
            printDate: new Date().toISOString(),
            printUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile/${profile.slug || userId}`,
        };
    }
    async shareToSocialMedia(userId, platform) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const profileUrl = `${baseUrl}/profile/${profile.slug || userId}`;
        const title = `${profile.firstName} ${profile.lastName} - Matrimonial Profile`;
        const description = `Check out my matrimonial profile on ${process.env.APP_NAME || 'Matrimonial'}`;
        const shareUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
            twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(title)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${profileUrl}`)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
        };
        return {
            platform,
            shareUrl: shareUrls[platform.toLowerCase()] || profileUrl,
            profileUrl,
        };
    }
};
exports.SocialService = SocialService;
exports.SocialService = SocialService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SocialService);
//# sourceMappingURL=social.service.js.map