import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async getChats(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      include: {
        user1: {
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
        user2: {
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
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Calculate unread counts for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await this.prisma.message.count({
          where: {
            chatId: chat.id,
            senderId: { not: userId }, // Messages not sent by current user
            isRead: false,
            // Filter out messages deleted for everyone OR deleted for this user
            AND: [
              { isDeleted: false },
              { NOT: { deletedBy: { has: userId } } },
            ],
          },
        });

        return {
          ...chat,
          otherUser: chat.user1Id === userId ? chat.user2 : chat.user1,
          lastMessage: chat.messages[0] || null,
          unreadCount,
        };
      }),
    );

    return chatsWithUnread;
  }

  async getUnreadCount(userId: string) {
    // Get all chats for the user
    const chats = await this.prisma.chat.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      select: { id: true },
    });

    const chatIds = chats.map(chat => chat.id);

    // Count all unread messages across all chats
    const totalUnread = await this.prisma.message.count({
      where: {
        chatId: { in: chatIds },
        senderId: { not: userId }, // Messages not sent by current user
        isRead: false,
        // Filter out messages deleted for everyone OR deleted for this user
        AND: [
          { isDeleted: false },
          { NOT: { deletedBy: { has: userId } } },
        ],
      },
    });

    return { totalUnread };
  }

  async getChat(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        user1: {
          include: {
            profile: {
              include: {
                photos: {
                  where: { isApproved: true },
                  orderBy: { order: 'asc' },
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
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.user1Id !== userId && chat.user2Id !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return {
      ...chat,
      currentUserId: userId,
      otherUser: chat.user1Id === userId ? chat.user2 : chat.user1,
    };
  }

  async getOrCreateChat(userId: string, otherUserId: string) {
    // Check if there's an accepted interest
    const interest = await this.prisma.interest.findFirst({
      where: {
        OR: [
          { fromUserId: userId, toUserId: otherUserId, status: 'ACCEPTED' },
          { fromUserId: otherUserId, toUserId: userId, status: 'ACCEPTED' },
        ],
      },
    });

    if (!interest) {
      throw new BadRequestException('No accepted interest found. Interest must be accepted before chatting.');
    }

    // Create or get chat
    const [id1, id2] = [userId, otherUserId].sort();
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
      include: {
        user1: {
          include: {
            profile: {
              include: {
                photos: {
                  where: { isApproved: true },
                  orderBy: { order: 'asc' },
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
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    return {
      ...chat,
      currentUserId: userId,
      otherUser: chat.user1Id === userId ? chat.user2 : chat.user1,
    };
  }

  async getMessages(chatId: string, userId: string, page: number = 1, limit: number = 50) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat || (chat.user1Id !== userId && chat.user2Id !== userId)) {
      throw new BadRequestException('Unauthorized');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          chatId,
          // Filter out messages deleted for everyone OR deleted for this user
          AND: [
            { isDeleted: false },
            { NOT: { deletedBy: { has: userId } } },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
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
        skip,
        take: limit,
      }),
      this.prisma.message.count({
        where: {
          chatId,
          // Filter out messages deleted for everyone OR deleted for this user
          AND: [
            { isDeleted: false },
            { NOT: { deletedBy: { has: userId } } },
          ],
        },
      }),
    ]);

    // Mark messages as read when user views them
    await this.prisma.message.updateMany({
      where: {
        chatId,
        senderId: { not: userId }, // Only mark messages from other users as read
        isRead: false,
        isDeleted: false,
      },
      data: { isRead: true },
    });

    return {
      messages: messages.reverse(),
      total,
      page,
      limit,
    };
  }

  async sendMessage(
    userId: string,
    chatId: string,
    data: {
      content?: string;
      imageUrl?: string;
      videoUrl?: string;
      audioUrl?: string;
      fileUrl?: string;
      fileName?: string;
      messageType?: string;
    },
  ) {
    const chat = await this.getChat(chatId, userId);

    const messageType = data.messageType || (data.imageUrl ? 'IMAGE' : data.videoUrl ? 'VIDEO' : data.audioUrl ? 'AUDIO' : data.fileUrl ? 'FILE' : 'TEXT');

    // Check for offensive language
    if (data.content && this.containsOffensiveLanguage(data.content)) {
      // Flag message for admin review (could also block or warn user)
      console.warn(`Message flagged for offensive language from user ${userId}`);
      // In production, you might want to:
      // - Set isReported flag automatically
      // - Send notification to admin
      // - Warn the user
    }

    const message = await this.prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content: data.content,
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        audioUrl: data.audioUrl,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        messageType,
      },
      include: {
        sender: {
          select: {
            id: true,
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

    // Update chat last message time
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: new Date() },
    });

    // Send notification to the other user
    const otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
    const notificationText = data.content 
      ? (data.content.length > 50 ? data.content.substring(0, 50) + '...' : data.content)
      : messageType === 'IMAGE' ? 'Sent an image' 
      : messageType === 'VIDEO' ? 'Sent a video'
      : messageType === 'AUDIO' ? 'Sent a voice message'
      : messageType === 'FILE' ? 'Sent a file'
      : 'Sent a message';
    
    await this.notificationsService.create(
      otherUserId,
      'MESSAGE',
      'New Message',
      notificationText,
      { chatId, senderId: userId, messageId: message.id },
      { sendEmail: false, sendPush: true, sendRealTime: true },
    );

    return message;
  }

  async searchMessages(userId: string, chatId: string, query: string, page: number = 1, limit: number = 20) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat || (chat.user1Id !== userId && chat.user2Id !== userId)) {
      throw new BadRequestException('Unauthorized');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          chatId,
          // Filter out messages deleted for everyone OR deleted for this user
          AND: [
            { isDeleted: false },
            { NOT: { deletedBy: { has: userId } } },
            {
              content: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
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
        skip,
        take: limit,
      }),
      this.prisma.message.count({
        where: {
          chatId,
          // Filter out messages deleted for everyone OR deleted for this user
          AND: [
            { isDeleted: false },
            { NOT: { deletedBy: { has: userId } } },
            {
              content: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
      }),
    ]);

    return {
      messages,
      total,
      page,
      limit,
      query,
    };
  }

  async markAsRead(userId: string, chatId: string, messageIds: string[]) {
    await this.prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        chatId,
        senderId: { not: userId },
      },
      data: { isRead: true },
    });
  }

  async deleteMessage(userId: string, messageId: string, deleteForEveryone: boolean = false) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chat: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is a participant in the chat (either user1 or user2)
    const isParticipant = message.chat.user1Id === userId || message.chat.user2Id === userId;
    
    if (!isParticipant) {
      throw new BadRequestException('Unauthorized: You are not a participant in this chat');
    }

    if (deleteForEveryone) {
      // Delete for everyone
      await this.prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true },
      });
    } else {
      // Delete for me only - add userId to deletedBy array
      const currentDeletedBy = Array.isArray(message.deletedBy) ? message.deletedBy : [];
      if (!currentDeletedBy.includes(userId)) {
        await this.prisma.message.update({
          where: { id: messageId },
          data: { deletedBy: { set: [...currentDeletedBy, userId] } },
        });
      }
    }

    return { message: 'Message deleted' };
  }

  async reportMessage(userId: string, messageId: string, reason: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { isReported: true },
    });

    await this.prisma.report.create({
      data: {
        reporterId: userId,
        reportedUserId: message.senderId,
        type: 'MESSAGE',
        reason,
        description: `Message ID: ${messageId}`,
      },
    });

    return { message: 'Message reported' };
  }

  private containsOffensiveLanguage(text: string): boolean {
    // Basic profanity filter - for production, consider using a library like 'bad-words' or 'profanity-checker'
    const offensiveWords = [
      // Spam/scam related
      'spam', 'scam', 'fraud', 'phishing',
      // Common offensive words (basic list)
      'hate', 'kill', 'die',
      // Add more as needed
    ];
    const lowerText = text.toLowerCase();
    
    // Check for exact word matches and common variations
    return offensiveWords.some(word => {
      const regex = new RegExp(`\\b${word}\\w*\\b`, 'i');
      return regex.test(lowerText);
    });
  }
}

