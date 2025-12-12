import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  async checkAndAwardAchievements(userId: string, action: string) {
    const achievements: { [key: string]: { type: string; title: string; description: string; points: number } } = {
      PROFILE_COMPLETE: {
        type: 'PROFILE_COMPLETE',
        title: 'Profile Complete',
        description: 'You completed your profile!',
        points: 50,
      },
      FIRST_INTEREST: {
        type: 'FIRST_INTEREST',
        title: 'First Interest',
        description: 'You sent your first interest!',
        points: 10,
      },
      FIRST_MATCH: {
        type: 'FIRST_MATCH',
        title: 'First Match',
        description: 'You got your first match!',
        points: 25,
      },
      FIRST_MESSAGE: {
        type: 'FIRST_MESSAGE',
        title: 'First Message',
        description: 'You sent your first message!',
        points: 15,
      },
      PROFILE_VERIFIED: {
        type: 'PROFILE_VERIFIED',
        title: 'Verified Profile',
        description: 'Your profile is verified!',
        points: 30,
      },
      PHOTO_UPLOADED: {
        type: 'PHOTO_UPLOADED',
        title: 'Photo Uploaded',
        description: 'You uploaded your first photo!',
        points: 5,
      },
    };

    const achievement = achievements[action];
    if (!achievement) {
      return null;
    }

    // Check if already awarded
    const existing = await this.prisma.achievement.findFirst({
      where: {
        userId,
        type: achievement.type,
      },
    });

    if (existing) {
      return null; // Already awarded
    }

    // Award achievement
    await this.prisma.achievement.create({
      data: {
        userId,
        type: achievement.type,
        title: achievement.title,
        description: achievement.description,
        points: achievement.points,
      },
    });

    // Add points to user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          increment: achievement.points,
        },
      },
    });

    return achievement;
  }

  async getUserAchievements(userId: string) {
    const achievements = await this.prisma.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    return {
      achievements,
      totalPoints: user?.points || 0,
      achievementCount: achievements.length,
    };
  }

  async getLeaderboard(limit: number = 10) {
    const users = await this.prisma.user.findMany({
      where: {
        points: { gt: 0 },
      },
      select: {
        id: true,
        email: true,
        points: true,
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
        achievements: {
          take: 3,
          orderBy: { unlockedAt: 'desc' },
        },
      },
      orderBy: { points: 'desc' },
      take: limit,
    });

    return users.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email,
      points: user.points,
      photo: user.profile?.photos[0]?.url,
      achievements: user.achievements,
    }));
  }

  async getUserRank(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    if (!user || user.points === 0) {
      return { rank: null, totalUsers: 0 };
    }

    const usersWithMorePoints = await this.prisma.user.count({
      where: {
        points: { gt: user.points },
      },
    });

    const totalUsers = await this.prisma.user.count({
      where: {
        points: { gt: 0 },
      },
    });

    return {
      rank: usersWithMorePoints + 1,
      totalUsers,
      points: user.points,
    };
  }
}

