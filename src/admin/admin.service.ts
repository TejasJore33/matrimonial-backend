import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getPendingProfiles(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [profiles, total] = await Promise.all([
      this.prisma.profile.findMany({
        where: { status: 'PENDING_APPROVAL' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              mobile: true,
            },
          },
          photos: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.profile.count({ where: { status: 'PENDING_APPROVAL' } }),
    ]);

    return { profiles, total, page, limit };
  }

  async approveProfile(profileId: string, adminId: string) {
    return this.prisma.profile.update({
      where: { id: profileId },
      data: {
        status: 'ACTIVE',
      },
    });
  }

  async rejectProfile(profileId: string, adminId: string, reason?: string) {
    return this.prisma.profile.update({
      where: { id: profileId },
      data: {
        status: 'REJECTED',
      },
    });
  }

  async getReports(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where: { status: 'PENDING' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
    ]);

    // Fetch reporter details separately since Report model doesn't have a relation
    const reportsWithReporter = await Promise.all(
      reports.map(async (report) => {
        const reporter = await this.prisma.user.findUnique({
          where: { id: report.reporterId },
          select: {
            id: true,
            email: true,
          },
        });
        return {
          ...report,
          reporter,
        };
      }),
    );

    return { reports: reportsWithReporter, total, page, limit };
  }

  async resolveReport(reportId: string, adminId: string, action: string) {
    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });
  }

  async bulkApproveProfiles(profileIds: string[], adminId: string) {
    const result = await this.prisma.profile.updateMany({
      where: {
        id: { in: profileIds },
        status: 'PENDING_APPROVAL',
      },
      data: {
        status: 'ACTIVE',
      },
    });
    return { ...result, message: `${result.count} profiles approved` };
  }

  async bulkRejectProfiles(profileIds: string[], adminId: string, reason?: string) {
    const result = await this.prisma.profile.updateMany({
      where: {
        id: { in: profileIds },
        status: 'PENDING_APPROVAL',
      },
      data: {
        status: 'REJECTED',
      },
    });
    return { ...result, message: `${result.count} profiles rejected` };
  }

  async getAdvancedAnalytics(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const end = endDate || new Date();

    const [
      newUsers,
      newProfiles,
      newSubscriptions,
      revenue,
      topRegions,
      conversionRate,
      userRetention,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.profile.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.subscription.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
      this.prisma.profile.groupBy({
        by: ['state'],
        where: {
          status: 'ACTIVE',
          createdAt: { gte: start, lte: end },
        },
        _count: { state: true },
        orderBy: { _count: { state: 'desc' } },
        take: 10,
      }),
      this.calculateConversionRate(start, end),
      this.calculateUserRetention(start, end),
    ]);

    return {
      period: { start, end },
      users: {
        new: newUsers,
        total: await this.prisma.user.count(),
      },
      profiles: {
        new: newProfiles,
        active: await this.prisma.profile.count({ where: { status: 'ACTIVE' } }),
      },
      subscriptions: {
        new: newSubscriptions,
        active: await this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      },
      revenue: {
        total: revenue._sum.amount || 0,
        currency: 'INR',
      },
      topRegions,
      conversionRate,
      userRetention,
    };
  }

  private async calculateConversionRate(start: Date, end: Date) {
    const totalUsers = await this.prisma.user.count({
      where: { createdAt: { gte: start, lte: end } },
    });

    const paidUsersResult = await this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });
    const paidUsers = paidUsersResult.length;

    return totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0;
  }

  private async calculateUserRetention(start: Date, end: Date) {
    const usersInPeriod = await this.prisma.user.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { id: true, lastLoginAt: true },
    });

    const activeUsers = usersInPeriod.filter(
      user => user.lastLoginAt && user.lastLoginAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    ).length;

    return usersInPeriod.length > 0
      ? Math.round((activeUsers / usersInPeriod.length) * 100)
      : 0;
  }

  async exportData(format: 'csv' | 'json' = 'json') {
    // Export users, profiles, payments data
    const [users, profiles, payments] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          mobile: true,
          role: true,
          createdAt: true,
        },
      }),
      this.prisma.profile.findMany({
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.payment.findMany({
        where: { status: 'COMPLETED' },
        select: {
          id: true,
          userId: true,
          amount: true,
          type: true,
          createdAt: true,
        },
      }),
    ]);

    if (format === 'csv') {
      // Convert to CSV format
      return {
        users: this.convertToCSV(users),
        profiles: this.convertToCSV(profiles),
        payments: this.convertToCSV(payments),
      };
    }

    return { users, profiles, payments };
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  }

  async getAnalytics() {
    const [
      totalUsers,
      activeProfiles,
      totalSubscriptions,
      totalRevenue,
      dailyActiveUsers,
      pendingProfiles,
      rejectedProfiles,
      draftProfiles,
      totalPayments,
      monthlyRevenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.profile.count({ where: { status: 'ACTIVE' } }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.profile.count({ where: { status: 'PENDING_APPROVAL' } }),
      this.prisma.profile.count({ where: { status: 'REJECTED' } }),
      this.prisma.profile.count({ where: { status: 'DRAFT' } }),
      this.prisma.payment.count({ where: { status: 'COMPLETED' } }),
      this.prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalUsers,
      activeProfiles,
      totalSubscriptions,
      totalRevenue: totalRevenue._sum.amount || 0,
      dailyActiveUsers,
      pendingProfiles,
      rejectedProfiles,
      draftProfiles,
      totalPayments,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
    };
  }

  // User Management
  async getAllUsers(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          mobile: true,
          role: true,
          isEmailVerified: true,
          isMobileVerified: true,
          createdAt: true,
          lastLoginAt: true,
          profile: {
            select: {
              id: true,
              status: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            photos: true,
          },
        },
        subscriptions: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async suspendUser(userId: string, adminId: string) {
    // Soft delete by setting deletedAt
    return this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
  }

  async activateUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
    });
  }

  // Profile Management
  async getAllProfiles(page: number = 1, limit: number = 20, status?: string, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [profiles, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              mobile: true,
            },
          },
          photos: {
            where: { isApproved: true },
            take: 1,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.profile.count({ where }),
    ]);

    return { profiles, total, page, limit };
  }

  async suspendProfile(profileId: string, adminId: string) {
    return this.prisma.profile.update({
      where: { id: profileId },
      data: { status: 'SUSPENDED' },
    });
  }

  async deleteProfile(profileId: string) {
    return this.prisma.profile.delete({
      where: { id: profileId },
    });
  }

  // Subscription Management
  async getAllSubscriptions(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              mobile: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count(),
    ]);

    return { subscriptions, total, page, limit };
  }

  // Payment Management
  async getAllPayments(page: number = 1, limit: number = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              mobile: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { payments, total, page, limit };
  }

  // Photo Moderation
  async getPendingPhotos(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [photos, total] = await Promise.all([
      this.prisma.photo.findMany({
        where: { isApproved: false },
        include: {
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userId: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.photo.count({ where: { isApproved: false } }),
    ]);

    return { photos, total, page, limit };
  }

  async approvePhoto(photoId: string) {
    return this.prisma.photo.update({
      where: { id: photoId },
      data: { isApproved: true, isBlurred: false },
    });
  }

  async rejectPhoto(photoId: string) {
    return this.prisma.photo.delete({
      where: { id: photoId },
    });
  }
}

