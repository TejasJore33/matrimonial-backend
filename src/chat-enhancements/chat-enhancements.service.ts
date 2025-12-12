import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatEnhancementsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get message templates for user
   */
  async getMessageTemplates(userId: string, category?: string) {
    const where: any = { userId };
    if (category) {
      where.category = category;
    }

    return this.prisma.messageTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create message template
   */
  async createMessageTemplate(userId: string, name: string, content: string, category?: string) {
    return (this.prisma as any).messageTemplate.create({
      data: {
        userId,
        name,
        content,
        category,
      },
    });
  }

  /**
   * Update message template
   */
  async updateMessageTemplate(userId: string, templateId: string, name?: string, content?: string, category?: string) {
    const template = await this.prisma.messageTemplate.findFirst({
      where: { id: templateId, userId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return (this.prisma as any).messageTemplate.update({
      where: { id: templateId },
      data: {
        name: name || template.name,
        content: content || template.content,
        category: category !== undefined ? category : template.category,
      },
    });
  }

  /**
   * Delete message template
   */
  async deleteMessageTemplate(userId: string, templateId: string) {
    const template = await this.prisma.messageTemplate.findFirst({
      where: { id: templateId, userId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return (this.prisma as any).messageTemplate.delete({
      where: { id: templateId },
    });
  }

  /**
   * Get ice breakers for a profile
   */
  async getIceBreakers(userId: string, profileId: string) {
    // Get suggested questions based on profile
    const profile = await this.prisma.profile.findUnique({
      where: { userId: profileId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Default ice breaker questions
    const defaultQuestions = [
      'What are your hobbies and interests?',
      'Tell me about your family background.',
      'What are you looking for in a life partner?',
      'What are your career goals?',
      'How do you spend your weekends?',
      'What values are most important to you?',
    ];

    // Get user's saved ice breakers
    const savedBreakers = await (this.prisma as any).iceBreaker.findMany({
      where: { userId, profileId },
    });

    return {
      defaultQuestions,
      savedBreakers,
    };
  }

  /**
   * Save ice breaker answer
   */
  async saveIceBreaker(userId: string, profileId: string, question: string, answer?: string) {
    return (this.prisma as any).iceBreaker.upsert({
      where: {
        userId_profileId: {
          userId,
          profileId,
        },
      },
      create: {
        userId,
        profileId,
        question,
        answer,
      },
      update: {
        question,
        answer,
      },
    });
  }

  /**
   * Get chat reminders (unread messages older than 24 hours)
   */
  async getChatReminders(userId: string) {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const chats = await this.prisma.chat.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        messages: {
          where: {
            senderId: { not: userId },
            isRead: false,
            createdAt: { lt: oneDayAgo },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        user1: {
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
        user2: {
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
    });

    return chats
      .filter((chat) => chat.messages.length > 0)
      .map((chat) => ({
        chatId: chat.id,
        otherUser: chat.user1Id === userId ? chat.user2 : chat.user1,
        lastUnreadMessage: chat.messages[0],
        unreadCount: chat.messages.length,
      }));
  }
}

