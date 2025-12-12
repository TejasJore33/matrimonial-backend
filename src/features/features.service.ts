import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class FeaturesService {
  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
  ) {}

  /**
   * Check and award daily login reward
   */
  async checkDailyLoginReward(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastLoginDate = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
    if (lastLoginDate) {
      lastLoginDate.setHours(0, 0, 0, 0);
    }

    // Check if already logged in today
    if (lastLoginDate && lastLoginDate.getTime() === today.getTime()) {
      return { alreadyRewarded: true, streak: user.loginStreak };
    }

    // Calculate streak
    let newStreak = 1;
    if (lastLoginDate) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      if (lastLoginDate.getTime() === yesterday.getTime()) {
        // Consecutive day
        newStreak = user.loginStreak + 1;
      }
    }

    // Award points based on streak
    let pointsAwarded = 10; // Base reward
    if (newStreak >= 7) pointsAwarded = 50; // Weekly bonus
    if (newStreak >= 30) pointsAwarded = 200; // Monthly bonus

    // Update user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginDate: today,
        loginStreak: newStreak,
        points: { increment: pointsAwarded },
      },
    });

    // Create activity
    await this.createActivity(
      userId,
      'DAILY_LOGIN',
      `Daily login reward - ${pointsAwarded} points`,
      `Streak: ${newStreak} days`,
      {
        streak: newStreak,
        pointsAwarded,
      },
    );

    return {
      pointsAwarded,
      streak: newStreak,
      message: `You earned ${pointsAwarded} points! Streak: ${newStreak} days`,
    };
  }

  /**
   * Create activity entry
   */
  async createActivity(userId: string, type: string, title: string, description?: string, metadata?: any) {
    return this.prisma.activity.create({
      data: {
        userId,
        type,
        title,
        description,
        metadata: metadata || {},
      },
    });
  }

  /**
   * Get activity feed for user
   */
  async getActivityFeed(userId: string, limit: number = 20) {
    return (this.prisma as any).activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(category: string, period: string = 'WEEKLY', limit: number = 100) {
    const now = new Date();
    let periodStart: Date;

    switch (period) {
      case 'DAILY':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'WEEKLY':
        const dayOfWeek = now.getDay();
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - dayOfWeek);
        periodStart.setHours(0, 0, 0, 0);
        break;
      case 'MONTHLY':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        periodStart = new Date(0); // All time
    }

    return (this.prisma as any).leaderboard.findMany({
      where: {
        category,
        period,
        periodStart: { gte: periodStart },
      },
      include: {
        user: {
          include: {
            profile: {
              include: {
                photos: {
                  where: { isApproved: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { rank: 'asc' },
      take: limit,
    });
  }

  /**
   * Update leaderboard
   */
  async updateLeaderboard(userId: string, category: string, score: number) {
    const period = 'WEEKLY';
    const now = new Date();
    const dayOfWeek = now.getDay();
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - dayOfWeek);
    periodStart.setHours(0, 0, 0, 0);

    // Get all scores for this category and period
    const allScores = await this.prisma.leaderboard.findMany({
      where: {
        category,
        period,
        periodStart: { gte: periodStart },
      },
      orderBy: { score: 'desc' },
    });

    // Calculate rank
    const rank = allScores.findIndex((s) => s.score < score) + 1 || allScores.length + 1;

    // Update or create entry
    await (this.prisma as any).leaderboard.upsert({
      where: {
        userId_category_period_periodStart: {
          userId,
          category,
          period,
          periodStart,
        },
      },
      create: {
        userId,
        category,
        period,
        periodStart,
        rank,
        score,
      },
      update: {
        rank,
        score,
      },
    });

    // Recalculate ranks for others
    const updatedScores = await (this.prisma as any).leaderboard.findMany({
      where: {
        category,
        period,
        periodStart: { gte: periodStart },
      },
      orderBy: { score: 'desc' },
    });

      // Update ranks
      for (let i = 0; i < updatedScores.length; i++) {
        await (this.prisma as any).leaderboard.update({
        where: { id: updatedScores[i].id },
        data: { rank: i + 1 },
      });
    }
  }
}

