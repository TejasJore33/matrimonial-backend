import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async uploadDocument(userId: string, file: Express.Multer.File, type: string, name: string, expiryDate?: Date) {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only PDF, Word, and images are allowed.');
    }

    // Upload file
    const uploadResult = await this.uploadService.uploadDocument(file, `documents/${type}`) as { url: string; publicId: string };

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

  async getDocuments(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDocumentById(userId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async deleteDocument(userId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete from storage
    try {
      // Check if it's an image or document and use appropriate method
      if (document.url.includes('image') || document.url.match(/\.(jpg|jpeg|png|gif)$/i)) {
        await this.uploadService.deleteImage(document.url);
      } else {
        // For documents, try to extract publicId and delete
        const publicId = document.url.split('/').pop()?.split('.')[0];
        if (publicId) {
          await this.uploadService.deleteImage(publicId); // Works for both images and documents in Cloudinary
        }
      }
    } catch (error) {
      console.error('Failed to delete file from storage:', error);
    }

    await this.prisma.document.delete({
      where: { id: documentId },
    });

    return { message: 'Document deleted' };
  }

  async verifyDocument(documentId: string, adminId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.prisma.document.update({
      where: { id: documentId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });
  }

  async getExpiringDocuments(days: number = 30) {
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
}

