import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class VerificationService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async submitVerification(userId: string, data: {
    idType: string;
    idNumber?: string;
    idPhoto?: Express.Multer.File;
    selfie?: Express.Multer.File;
  }) {
    // Check if verification already exists
    const existing = await this.prisma.verification.findUnique({
      where: { userId },
    });

    let idPhotoUrl: string | undefined;
    let selfieUrl: string | undefined;

    // Upload ID photo
    if (data.idPhoto) {
      const result = await this.uploadService.uploadImage(data.idPhoto, 'verifications/id') as { url: string };
      idPhotoUrl = result.url;
    }

    // Upload selfie
    if (data.selfie) {
      const result = await this.uploadService.uploadImage(data.selfie, 'verifications/selfie') as { url: string };
      selfieUrl = result.url;
    }

    if (existing) {
      // Update existing verification
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

    // Create new verification
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

  async getVerification(userId: string) {
    const verification = await this.prisma.verification.findUnique({
      where: { userId },
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    return verification;
  }

  async approveVerification(userId: string, adminId: string) {
    const verification = await this.prisma.verification.findUnique({
      where: { userId },
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    // Update verification status
    await this.prisma.verification.update({
      where: { userId },
      data: {
        status: 'APPROVED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    // Update profile verification status
    await this.prisma.profile.updateMany({
      where: { userId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    return { message: 'Verification approved' };
  }

  async rejectVerification(userId: string, adminId: string, reason?: string) {
    const verification = await this.prisma.verification.findUnique({
      where: { userId },
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
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

  async verifyPhone(userId: string, otp: string) {
    // This would integrate with OTP service
    // For now, just mark as verified
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isMobileVerified: true,
      },
    });

    return { message: 'Phone verified' };
  }

  async verifyEmail(userId: string, otp: string) {
    // This would integrate with OTP service
    // For now, just mark as verified
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isEmailVerified: true,
      },
    });

    return { message: 'Email verified' };
  }
}

