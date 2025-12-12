import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferralService {
  constructor(private prisma: PrismaService) {}

  async generateReferralCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If user already has a referral code, return it
    if (user.referralCode) {
      return user.referralCode;
    }

    // Generate unique referral code
    let referralCode: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      referralCode = `${user.email?.substring(0, 3).toUpperCase() || 'USR'}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const existing = await this.prisma.user.findUnique({
        where: { referralCode },
      });

      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      referralCode = `REF${userId.substring(0, 8).toUpperCase()}`;
    }

    // Save referral code
    await this.prisma.user.update({
      where: { id: userId },
      data: { referralCode },
    });

    return referralCode;
  }

  async applyReferralCode(userId: string, referralCode: string) {
    // Check if user already used a referral code
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        referredByRef: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.referredBy) {
      throw new BadRequestException('You have already used a referral code');
    }

    if (user.referralCode === referralCode) {
      throw new BadRequestException('Cannot use your own referral code');
    }

    // Find referrer
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode },
    });

    if (!referrer) {
      throw new NotFoundException('Invalid referral code');
    }

    // Create referral record
    const referral = await this.prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: userId,
        status: 'PENDING',
      },
    });

    // Update user's referredBy
    await this.prisma.user.update({
      where: { id: userId },
      data: { referredBy: referrer.id },
    });

    // Award points to referrer (can be configured)
    const rewardPoints = 100;
    await this.prisma.user.update({
      where: { id: referrer.id },
      data: {
        points: {
          increment: rewardPoints,
        },
      },
    });

    // Create achievement for referrer
    await this.prisma.achievement.create({
      data: {
        userId: referrer.id,
        type: 'REFERRAL',
        title: 'First Referral',
        description: 'You referred your first friend!',
        points: rewardPoints,
      },
    });

    return {
      message: 'Referral code applied successfully',
      referral,
      rewardPoints,
    };
  }

  async getReferralStats(userId: string) {
    const [referrals, totalRewards, completedReferrals] = await Promise.all([
      this.prisma.referral.findMany({
        where: { referrerId: userId },
        include: {
          referred: {
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
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.referral.aggregate({
        where: { referrerId: userId },
        _sum: {
          rewardAmount: true,
        },
      }),
      this.prisma.referral.count({
        where: {
          referrerId: userId,
          status: 'COMPLETED',
        },
      }),
    ]);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        referredBy: true,
        points: true,
      },
    });

    return {
      referralCode: user.referralCode,
      totalReferrals: referrals.length,
      completedReferrals,
      pendingReferrals: referrals.filter(r => r.status === 'PENDING').length,
      totalRewards: totalRewards._sum.rewardAmount || 0,
      points: user.points,
      referrals,
    };
  }

  async getMyReferralCode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate if doesn't exist
    if (!user.referralCode) {
      return this.generateReferralCode(userId);
    }

    return {
      referralCode: user.referralCode,
      referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${user.referralCode}`,
    };
  }

  async markReferralCompleted(referredId: string) {
    // This is called when a referred user completes certain actions (e.g., premium subscription)
    const referral = await this.prisma.referral.findFirst({
      where: {
        referredId,
        status: 'PENDING',
      },
    });

    if (!referral) {
      return;
    }

    // Mark as completed and award reward
    const rewardAmount = 500; // Can be configured
    await this.prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'COMPLETED',
        rewardAmount,
        completedAt: new Date(),
      },
    });

    // Award points to referrer
    await this.prisma.user.update({
      where: { id: referral.referrerId },
      data: {
        points: {
          increment: rewardAmount,
        },
      },
    });

    return referral;
  }
}

