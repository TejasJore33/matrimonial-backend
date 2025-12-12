import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as QRCode from 'qrcode';

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  async generateProfileShareLink(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareLink = `${baseUrl}/profile/${profile.slug || userId}`;

    return {
      shareLink,
      shortLink: shareLink, // In production, use a URL shortener
    };
  }

  async generateProfileQRCode(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
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
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  async getProfileForPrint(userId: string) {
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
      throw new NotFoundException('Profile not found');
    }

    // Format for printing
    return {
      ...profile,
      printDate: new Date().toISOString(),
      printUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile/${profile.slug || userId}`,
    };
  }

  async shareToSocialMedia(userId: string, platform: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const profileUrl = `${baseUrl}/profile/${profile.slug || userId}`;
    const title = `${profile.firstName} ${profile.lastName} - Matrimonial Profile`;
    const description = `Check out my matrimonial profile on ${process.env.APP_NAME || 'Matrimonial'}`;

    const shareUrls: { [key: string]: string } = {
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
}

