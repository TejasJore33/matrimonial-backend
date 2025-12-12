import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlockService {
  constructor(private prisma: PrismaService) {}

  async blockUser(blockerId: string, blockedId: string, reason?: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: blockedId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already blocked
    const existing = await this.prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User already blocked');
    }

    // Block user
    await this.prisma.blockedUser.create({
      data: {
        blockerId,
        blockedId,
        reason,
      },
    });

    // Delete any existing interests between them
    await this.prisma.interest.deleteMany({
      where: {
        OR: [
          { fromUserId: blockerId, toUserId: blockedId },
          { fromUserId: blockedId, toUserId: blockerId },
        ],
      },
    });

    // Delete any existing chats
    await this.prisma.chat.deleteMany({
      where: {
        OR: [
          { user1Id: blockerId, user2Id: blockedId },
          { user1Id: blockedId, user2Id: blockerId },
        ],
      },
    });

    return { message: 'User blocked successfully' };
  }

  async unblockUser(blockerId: string, blockedId: string) {
    const blocked = await this.prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (!blocked) {
      throw new NotFoundException('User not blocked');
    }

    await this.prisma.blockedUser.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    return { message: 'User unblocked successfully' };
  }

  async getBlockedUsers(userId: string) {
    return this.prisma.blockedUser.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            email: true,
            mobile: true,
            profile: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                photos: {
                  where: { isPrimary: true },
                  take: 1,
                },
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

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const blocked = await this.prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    return !!blocked;
  }

  async checkBlockedStatus(userId1: string, userId2: string): Promise<{ isBlocked: boolean; blockedBy: string | null }> {
    const block1 = await this.prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: userId1,
          blockedId: userId2,
        },
      },
    });

    const block2 = await this.prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: userId2,
          blockedId: userId1,
        },
      },
    });

    if (block1) {
      return { isBlocked: true, blockedBy: userId1 };
    }

    if (block2) {
      return { isBlocked: true, blockedBy: userId2 };
    }

    return { isBlocked: false, blockedBy: null };
  }
}

