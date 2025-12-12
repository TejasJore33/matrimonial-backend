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
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const upload_service_1 = require("../upload/upload.service");
let DocumentsService = class DocumentsService {
    constructor(prisma, uploadService) {
        this.prisma = prisma;
        this.uploadService = uploadService;
    }
    async uploadDocument(userId, file, type, name, expiryDate) {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Invalid file type. Only PDF, Word, and images are allowed.');
        }
        const uploadResult = await this.uploadService.uploadDocument(file, `documents/${type}`);
        return this.prisma.document.create({
            data: {
                userId,
                type,
                name,
                url: uploadResult.url,
                expiryDate,
                isVerified: false,
            },
        });
    }
    async getDocuments(userId) {
        return this.prisma.document.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getDocumentById(userId, documentId) {
        const document = await this.prisma.document.findFirst({
            where: {
                id: documentId,
                userId,
            },
        });
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        return document;
    }
    async deleteDocument(userId, documentId) {
        const document = await this.prisma.document.findFirst({
            where: {
                id: documentId,
                userId,
            },
        });
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        try {
            if (document.url.includes('image') || document.url.match(/\.(jpg|jpeg|png|gif)$/i)) {
                await this.uploadService.deleteImage(document.url);
            }
            else {
                const publicId = document.url.split('/').pop()?.split('.')[0];
                if (publicId) {
                    await this.uploadService.deleteImage(publicId);
                }
            }
        }
        catch (error) {
            console.error('Failed to delete file from storage:', error);
        }
        await this.prisma.document.delete({
            where: { id: documentId },
        });
        return { message: 'Document deleted' };
    }
    async verifyDocument(documentId, adminId) {
        const document = await this.prisma.document.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        return this.prisma.document.update({
            where: { id: documentId },
            data: {
                isVerified: true,
                verifiedAt: new Date(),
            },
        });
    }
    async getExpiringDocuments(days = 30) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);
        return this.prisma.document.findMany({
            where: {
                expiryDate: {
                    lte: expiryDate,
                    gte: new Date(),
                },
                isVerified: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        mobile: true,
                    },
                },
            },
        });
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        upload_service_1.UploadService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map