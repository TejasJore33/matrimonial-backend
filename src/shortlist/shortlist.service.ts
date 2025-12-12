import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShortlistService {
  constructor(private prisma: PrismaService) {}

  async addToShortlist(userId: string, profileId: string, folderName?: string, notes?: string) {
    // Check if profile exists
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Check if already shortlisted
    const existing = await this.prisma.shortlist.findUnique({
      where: {
        userId_profileId: {
          userId,
          profileId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Profile already in shortlist');
    }

    // Add to shortlist
    return this.prisma.shortlist.create({
      data: {
        userId,
        profileId,
        folderName: folderName || 'Default',
        notes,
      },
      include: {
        profile: {
          include: {
            photos: {
              where: { isPrimary: true },
              take: 1,
            },
            user: {
              select: {
                id: true,
                email: true,
                mobile: true,
              },
            },
          },
        },
      },
    });
  }

  async removeFromShortlist(userId: string, profileId: string) {
    const shortlist = await this.prisma.shortlist.findUnique({
      where: {
        userId_profileId: {
          userId,
          profileId,
        },
      },
    });

    if (!shortlist) {
      throw new NotFoundException('Profile not in shortlist');
    }

    await this.prisma.shortlist.delete({
      where: {
        userId_profileId: {
          userId,
          profileId,
        },
      },
    });

    return { message: 'Removed from shortlist' };
  }

  async getShortlist(userId: string, folderName?: string) {
    const where: any = { userId };
    if (folderName) {
      where.folderName = folderName;
    }

    return this.prisma.shortlist.findMany({
      where,
      include: {
        profile: {
          include: {
            photos: {
              where: { isPrimary: true },
              take: 1,
            },
            user: {
              select: {
                id: true,
                email: true,
                mobile: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateShortlist(userId: string, profileId: string, folderName?: string, notes?: string) {
    const shortlist = await this.prisma.shortlist.findUnique({
      where: {
        userId_profileId: {
          userId,
          profileId,
        },
      },
    });

    if (!shortlist) {
      throw new NotFoundException('Profile not in shortlist');
    }

    return this.prisma.shortlist.update({
      where: {
        userId_profileId: {
          userId,
          profileId,
        },
      },
      data: {
        ...(folderName && { folderName }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        profile: {
          include: {
            photos: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
    });
  }

  async getShortlistFolders(userId: string) {
    const folders = await this.prisma.shortlist.findMany({
      where: { userId },
      select: {
        folderName: true,
      },
      distinct: ['folderName'],
    });

    return folders.map(f => f.folderName);
  }

  async isShortlisted(userId: string, profileId: string): Promise<boolean> {
    const shortlist = await this.prisma.shortlist.findUnique({
      where: {
        userId_profileId: {
          userId,
          profileId,
        },
      },
    });

    return !!shortlist;
  }
}

