import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PAID_SUBSCRIPTION_PLANS } from '../common/constants/subscription.constants';

@Injectable()
export class InterestsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async sendInterest(fromUserId: string, toUserId: string, message?: string) {
    if (fromUserId === toUserId) {
      throw new BadRequestException('Cannot send interest to yourself');
    }

    // Check if already sent
    const existing = await this.prisma.interest.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId,
          toUserId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Interest already sent');
    }

    // Check daily limit for free users
    const user = await this.prisma.user.findUnique({
      where: { id: fromUserId },
      include: {
        subscriptions: {
          where: {
            status: 'ACTIVE',
            endDate: { gt: new Date() },
            plan: {in:[...PAID_SUBSCRIPTION_PLANS]},
          },
        },
      },
    });

    const hasPaidPlan = user.subscriptions.length > 0;

    if (!hasPaidPlan) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const count = await this.prisma.interest.count({
        where: {
          fromUserId,
          createdAt: { gte: today },
        },
      });

      if (count >= 5) {
        throw new BadRequestException('Daily interest limit reached. Upgrade to premium for unlimited interests.');
      }
    }

    const interest = await this.prisma.interest.create({
      data: {
        fromUserId,
        toUserId,
        message,
        status: 'PENDING',
      },
      include: {
        fromUser: {
          include: {
            profile: {
              include: {
                photos: {
                  where: { isApproved: true },
                  orderBy: { order: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // Check for mutual match
    const reverseInterest = await this.prisma.interest.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: toUserId,
          toUserId: fromUserId,
        },
      },
    });

    if (reverseInterest && reverseInterest.status === 'PENDING') {
      // Mutual match!
      await Promise.all([
        this.prisma.interest.update({
          where: { id: interest.id },
          data: { status: 'ACCEPTED' },
        }),
        this.prisma.interest.update({
          where: { id: reverseInterest.id },
          data: { status: 'ACCEPTED' },
        }),
        // Send match notifications to both users
        this.notificationsService.create(
          toUserId,
          'MATCH',
          'Mutual Match!',
          'You both liked each other!',
          { matchedUserId: fromUserId },
          { sendEmail: true, sendPush: true, sendRealTime: true },
        ),
        this.notificationsService.create(
          fromUserId,
          'MATCH',
          'Mutual Match!',
          'You both liked each other!',
          { matchedUserId: toUserId },
          { sendEmail: true, sendPush: true, sendRealTime: true },
        ),
        // Award achievements
        this.awardAchievement(fromUserId, 'FIRST_MATCH'),
        this.awardAchievement(toUserId, 'FIRST_MATCH'),
      ]);
    } else {
      // Award first interest achievement
      await this.awardAchievement(fromUserId, 'FIRST_INTEREST');
      // Send notification
      await this.notificationsService.create(
        toUserId,
        'INTEREST',
        'New Interest Received',
        'Someone sent you an interest',
        { fromUserId },
        { sendEmail: true, sendPush: true, sendRealTime: true },
      );
    }

    return interest;
  }

  async acceptInterest(userId: string, interestId: string) {
    const interest = await this.prisma.interest.findUnique({
      where: { id: interestId },
    });

    if (!interest) {
      throw new NotFoundException('Interest not found');
    }

    if (interest.toUserId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    // If already accepted, return success (idempotent operation)
    if (interest.status === 'ACCEPTED') {
      // Ensure chat exists even if already accepted
      await this.ensureChatExists(interest.fromUserId, userId);
      return { message: 'Interest already accepted', alreadyProcessed: true };
    }

    // If already rejected, return error
    if (interest.status === 'REJECTED') {
      throw new BadRequestException('Interest was already rejected');
    }

    // Check for mutual match
    const reverseInterest = await this.prisma.interest.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: userId,
          toUserId: interest.fromUserId,
        },
      },
    });

    if (reverseInterest && reverseInterest.status === 'PENDING') {
      // Mutual match!
      await Promise.all([
        this.prisma.interest.update({
          where: { id: interest.id },
          data: { status: 'ACCEPTED' },
        }),
        this.prisma.interest.update({
          where: { id: reverseInterest.id },
          data: { status: 'ACCEPTED' },
        }),
        this.notificationsService.create(
          interest.fromUserId,
          'MATCH',
          'Mutual Match!',
          'You both liked each other!',
          { matchedUserId: userId },
          { sendEmail: true, sendPush: true, sendRealTime: true },
        ),
      ]);
    } else {
      await this.prisma.interest.update({
        where: { id: interest.id },
        data: { status: 'ACCEPTED' },
      });
    }

    // Create chat when interest is accepted (not just for mutual matches)
    await this.ensureChatExists(interest.fromUserId, userId);

    return { message: 'Interest accepted' };
  }

  async rejectInterest(userId: string, interestId: string) {
    const interest = await this.prisma.interest.findUnique({
      where: { id: interestId },
    });

    if (!interest) {
      throw new NotFoundException('Interest not found');
    }

    if (interest.toUserId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    // If already rejected, return success (idempotent operation)
    if (interest.status === 'REJECTED') {
      return { message: 'Interest already rejected', alreadyProcessed: true };
    }

    // If already accepted, return error
    if (interest.status === 'ACCEPTED') {
      throw new BadRequestException('Interest was already accepted');
    }

    await this.prisma.interest.update({
      where: { id: interestId },
      data: { status: 'REJECTED' },
    });

    return { message: 'Interest rejected' };
  }

  async getReceivedInterests(userId: string) {
    return this.prisma.interest.findMany({
      where: { 
        toUserId: userId,
        status: 'PENDING', // Only show pending interests
      },
      include: {
        fromUser: {
          include: {
            profile: {
              include: {
                photos: {
                  where: { isApproved: true },
                  orderBy: { order: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSentInterests(userId: string) {
    const interests = await this.prisma.interest.findMany({
      where: { fromUserId: userId },
      include: {
        toUser: {
          include: {
            profile: {
              include: {
                photos: {
                  where: { isApproved: true },
                  orderBy: { order: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // For accepted interests, include chatId
    const interestsWithChats = await Promise.all(
      interests.map(async (interest) => {
        if (interest.status === 'ACCEPTED') {
          const [id1, id2] = [userId, interest.toUserId].sort();
          const chat = await this.prisma.chat.findUnique({
            where: {
              user1Id_user2Id: {
                user1Id: id1,
                user2Id: id2,
              },
            },
          });
          return {
            ...interest,
            chatId: chat?.id || null,
          };
        }
        return interest;
      }),
    );

    return interestsWithChats;
  }

  async getMatches(userId: string) {
    const interests = await this.prisma.interest.findMany({
      where: {
        OR: [
          { fromUserId: userId, status: 'ACCEPTED' },
          { toUserId: userId, status: 'ACCEPTED' },
        ],
      },
      include: {
        fromUser: {
          include: {
            profile: {
              include: {
                photos: {
                  where: { isApproved: true },
                  orderBy: { order: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
        toUser: {
          include: {
            profile: {
              include: {
                photos: {
                  where: { isApproved: true },
                  orderBy: { order: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // Get chat IDs for each match (create if doesn't exist)
    const matchesWithChats = await Promise.all(
      interests.map(async (interest) => {
        const otherUserId = interest.fromUserId === userId ? interest.toUserId : interest.fromUserId;
        const [id1, id2] = [userId, otherUserId].sort();
        
        // Find or create chat
        const chat = await this.prisma.chat.upsert({
          where: {
            user1Id_user2Id: {
              user1Id: id1,
              user2Id: id2,
            },
          },
          create: {
            user1Id: id1,
            user2Id: id2,
          },
          update: {},
        });

        return {
          ...interest,
          matchedUser: interest.fromUserId === userId ? interest.toUser : interest.fromUser,
          chatId: chat.id,
        };
      }),
    );

    return matchesWithChats;
  }

  async withdrawInterest(userId: string, interestId: string) {
    const interest = await this.prisma.interest.findUnique({
      where: { id: interestId },
    });

    if (!interest) {
      throw new NotFoundException('Interest not found');
    }

    if (interest.fromUserId !== userId) {
      throw new BadRequestException('Unauthorized - You can only withdraw interests you sent');
    }

    if (interest.status !== 'PENDING') {
      throw new BadRequestException('Cannot withdraw interest that is not pending');
    }

    await this.prisma.interest.update({
      where: { id: interestId },
      data: { status: 'WITHDRAWN' },
    });

    return { message: 'Interest withdrawn successfully' };
  }

  async getInterestHistory(userId: string, filters?: { status?: string; type?: 'sent' | 'received' }) {
    const where: any = {};

    if (filters?.type === 'sent') {
      where.fromUserId = userId;
    } else if (filters?.type === 'received') {
      where.toUserId = userId;
    } else {
      where.OR = [
        { fromUserId: userId },
        { toUserId: userId },
      ];
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.interest.findMany({
      where,
      include: {
        fromUser: {
          include: {
            profile: {
              include: {
                photos: {
                  where: { isApproved: true },
                  orderBy: { order: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
        toUser: {
          include: {
            profile: {
              include: {
                photos: {
                  where: { isApproved: true },
                  orderBy: { order: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingInterestsReminder(userId: string) {
    // Get interests that have been pending for more than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const pendingInterests = await this.prisma.interest.findMany({
      where: {
        toUserId: userId,
        status: 'PENDING',
        createdAt: { lte: sevenDaysAgo },
      },
      include: {
        fromUser: {
          include: {
            profile: {
              select: {
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
      orderBy: { createdAt: 'asc' },
    });

    return {
      count: pendingInterests.length,
      interests: pendingInterests,
      message: `You have ${pendingInterests.length} pending interest(s) waiting for your response`,
    };
  }

  async getInterestStats(userId: string) {
    const [sent, received, accepted, rejected, pending, withdrawn] = await Promise.all([
      this.prisma.interest.count({ where: { fromUserId: userId } }),
      this.prisma.interest.count({ where: { toUserId: userId } }),
      this.prisma.interest.count({
        where: {
          OR: [
            { fromUserId: userId, status: 'ACCEPTED' },
            { toUserId: userId, status: 'ACCEPTED' },
          ],
        },
      }),
      this.prisma.interest.count({ where: { toUserId: userId, status: 'REJECTED' } }),
      this.prisma.interest.count({ where: { toUserId: userId, status: 'PENDING' } }),
      this.prisma.interest.count({ where: { fromUserId: userId, status: 'WITHDRAWN' } }),
    ]);

    return {
      sent,
      received,
      accepted,
      rejected,
      pending,
      withdrawn,
      acceptanceRate: received > 0 ? Math.round((accepted / received) * 100) : 0,
    };
  }

  private async ensureChatExists(user1Id: string, user2Id: string) {
    const [id1, id2] = [user1Id, user2Id].sort();
    await this.prisma.chat.upsert({
      where: {
        user1Id_user2Id: {
          user1Id: id1,
          user2Id: id2,
        },
      },
      create: {
        user1Id: id1,
        user2Id: id2,
      },
      update: {},
    });
  }

  private async awardAchievement(userId: string, action: string) {
    try {
      const { GamificationService } = await import('../gamification/gamification.service');
      const gamificationService = new GamificationService(this.prisma);
      await gamificationService.checkAndAwardAchievements(userId, action);
    } catch (error) {
      // Silently fail if gamification service not available
    }
  }

  /**
   * Send interests to multiple users (bulk action)
   */
  async sendBulkInterests(fromUserId: string, userIds: string[], message?: string) {
    const results = [];

    for (const toUserId of userIds) {
      try {
        const interest = await this.sendInterest(fromUserId, toUserId, message);
        results.push({ userId: toUserId, success: true, interest });
      } catch (error: any) {
        results.push({ userId: toUserId, success: false, error: error.message });
      }
    }

    return {
      total: userIds.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }
}

