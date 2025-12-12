"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const upload_service_1 = require("../upload/upload.service");
let VerificationService = class VerificationService {
    constructor(prisma, uploadService) {
        this.prisma = prisma;
        this.uploadService = uploadService;
    }
    async submitVerification(userId, data) {
        const existing = await this.prisma.verification.findUnique({
            where: { userId },
        });
        let idPhotoUrl;
        let selfieUrl;
        if (data.idPhoto) {
            const result = await this.uploadService.uploadImage(data.idPhoto, 'verifications/id');
            idPhotoUrl = result.url;
        }
        if (data.selfie) {
            const result = await this.uploadService.uploadImage(data.selfie, 'verifications/selfie');
            selfieUrl = result.url;
        }
        if (existing) {
            return this.prisma.verification.update({
                where: { userId },
                data: {
                    idType: data.idType,
                    idNumber: data.idNumber,
                    idPhotoUrl: idPhotoUrl || existing.idPhotoUrl,
                    selfieUrl: selfieUrl || existing.selfieUrl,
                    status: 'PENDING',
                },
            });
        }
        return this.prisma.verification.create({
            data: {
                userId,
                idType: data.idType,
                idNumber: data.idNumber,
                idPhotoUrl,
                selfieUrl,
                status: 'PENDING',
            },
        });
    }
    async getVerification(userId) {
        const verification = await this.prisma.verification.findUnique({
            where: { userId },
        });
        if (!verification) {
            throw new common_1.NotFoundException('Verification not found');
        }
        return verification;
    }
    async approveVerification(userId, adminId) {
        const verification = await this.prisma.verification.findUnique({
            where: { userId },
        });
        if (!verification) {
            throw new common_1.NotFoundException('Verification not found');
        }
        await this.prisma.verification.update({
            where: { userId },
            data: {
                status: 'APPROVED',
                reviewedBy: adminId,
                reviewedAt: new Date(),
            },
        });
        await this.prisma.profile.updateMany({
            where: { userId },
            data: {
                isVerified: true,
                verifiedAt: new Date(),
            },
        });
        return { message: 'Verification approved' };
    }
    async rejectVerification(userId, adminId, reason) {
        const verification = await this.prisma.verification.findUnique({
            where: { userId },
        });
        if (!verification) {
            throw new common_1.NotFoundException('Verification not found');
        }
        return this.prisma.verification.update({
            where: { userId },
            data: {
                status: 'REJECTED',
                reviewedBy: adminId,
                reviewedAt: new Date(),
            },
        });
    }
    async verifyPhone(userId, otp) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                isMobileVerified: true,
            },
        });
        return { message: 'Phone verified' };
    }
    async verifyEmail(userId, otp) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                isEmailVerified: true,
            },
        });
        return { message: 'Email verified' };
    }
};
exports.VerificationService = VerificationService;
exports.VerificationService = VerificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        upload_service_1.UploadService])
], VerificationService);
//# sourceMappingURL=verification.service.js.map