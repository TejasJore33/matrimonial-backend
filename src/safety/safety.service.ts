import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SafetyService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Report a user or content
   */
  async reportUser(
    reporterId: string,
    reportedUserId: string,
    type: 'PROFILE' | 'MESSAGE' | 'PHOTO',
    reason: string,
    description?: string,
    messageId?: string,
    photoId?: string,
  ) {
    if (reporterId === reportedUserId) {
      throw new BadRequestException('Cannot report yourself');
    }

    // Check if already reported
    const existing = await this.prisma.report.findFirst({
      where: {
        reporterId,
        reportedUserId,
        type,
        status: 'PENDING',
      },
    });

    if (existing) {
      throw new BadRequestException('You have already reported this user');
    }

    const report = await this.prisma.report.create({
      data: {
        reporterId,
        reportedUserId,
        type,
        reason,
        description,
      },
    });

    // Notify admins
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
    });

    for (const admin of admins) {
      await this.notificationsService.create(
        admin.id,
        'REPORT',
        'New Report Submitted',
        `A user has been reported: ${reason}`,
        { reportId: report.id, reporterId, reportedUserId },
        { sendEmail: true, sendPush: false, sendRealTime: true },
      );
    }

    return report;
  }

  /**
   * Get safety tips and guidelines
   */
  async getSafetyTips() {
    return {
      tips: [
        {
          title: 'Protect Your Personal Information',
          description: 'Never share your personal contact details, address, or financial information in early conversations.',
        },
        {
          title: 'Meet in Public Places',
          description: 'Always meet in public places for the first few times. Inform a friend or family member about your plans.',
        },
        {
          title: 'Trust Your Instincts',
          description: 'If something feels off or makes you uncomfortable, trust your instincts and take appropriate action.',
        },
        {
          title: 'Verify Profiles',
          description: 'Look for verified profiles with complete information and multiple photos.',
        },
        {
          title: 'Report Suspicious Behavior',
          description: 'Report any suspicious behavior, harassment, or inappropriate content immediately.',
        },
        {
          title: 'Take Your Time',
          description: 'Take time to know the person before sharing personal information or meeting in person.',
        },
        {
          title: 'Video Call First',
          description: 'Consider having a video call before meeting in person to verify the person.',
        },
        {
          title: 'Stay Safe Online',
          description: 'Never send money or share financial information with anyone you meet online.',
        },
      ],
      emergencyContacts: {
        helpline: '+91-1800-XXX-XXXX',
        email: 'safety@matrimonial.com',
        reportUrl: '/report',
      },
    };
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(userId: string) {
    return this.prisma.blockedUser.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
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
    });
  }

  /**
   * Get user's reports
   */
  async getUserReports(userId: string) {
    const reports = await this.prisma.report.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' },
    });

    // Manually fetch reported user details since there's no relation defined
    const reportsWithUsers = await Promise.all(
      reports.map(async (report) => {
        const reportedUser = await this.prisma.user.findUnique({
          where: { id: report.reportedUserId },
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        return {
          ...report,
          reportedUser,
        };
      }),
    );

    return reportsWithUsers;
  }

  /**
   * Get safety statistics
   */
  async getSafetyStats(userId: string) {
    const [reportsMade, blockedCount, reportsReceived] = await Promise.all([
      this.prisma.report.count({ where: { reporterId: userId } }),
      this.prisma.blockedUser.count({ where: { blockerId: userId } }),
      this.prisma.report.count({ where: { reportedUserId: userId } }),
    ]);

    return {
      reportsMade,
      blockedCount,
      reportsReceived,
      safetyScore: this.calculateSafetyScore(reportsReceived),
    };
  }

  private calculateSafetyScore(reportsReceived: number): number {
    // Lower reports = higher safety score
    if (reportsReceived === 0) return 100;
    if (reportsReceived === 1) return 80;
    if (reportsReceived === 2) return 60;
    if (reportsReceived === 3) return 40;
    return Math.max(0, 100 - reportsReceived * 20);
  }
}

