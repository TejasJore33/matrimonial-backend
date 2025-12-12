import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class CommunityService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  // Forum/Discussion Board
  async createForumPost(userId: string, data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }) {
    return this.prisma.forumPost.create({
      data: {
        userId,
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags || [],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
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

  async getForumPosts(filters?: { category?: string; search?: string; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      this.prisma.forumPost.findMany({
        where,
        include: {
          user: {
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
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.forumPost.count({ where }),
    ]);

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createForumComment(userId: string, postId: string, content: string) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Forum post not found');
    }

    return this.prisma.forumComment.create({
      data: {
        userId,
        postId,
        content,
      },
      include: {
        user: {
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
    });
  }

  // Groups
  async createGroup(userId: string, data: {
    name: string;
    description: string;
    isPublic: boolean;
    photo?: Express.Multer.File;
  }) {
    let photoUrl: string | undefined;

    if (data.photo) {
      const result = await this.uploadService.uploadImage(data.photo, 'groups') as { url: string };
      photoUrl = result.url;
    }

    const group = await this.prisma.communityGroup.create({
      data: {
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
        photoUrl,
        createdBy: userId,
      },
    });

    // Add creator as admin member
    await this.prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId,
        role: 'ADMIN',
      },
    });

    return group;
  }

  async joinGroup(userId: string, groupId: string) {
    const group = await this.prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const existingMember = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException('Already a member of this group');
    }

    return this.prisma.groupMember.create({
      data: {
        groupId,
        userId,
        role: 'MEMBER',
      },
    });
  }

  async getGroups(filters?: { search?: string; isPublic?: boolean }) {
    const where: any = {};

    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.communityGroup.findMany({
      where,
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Events
  async createEvent(userId: string, data: {
    title: string;
    description: string;
    eventDate: Date;
    location: string;
    maxParticipants?: number;
    photo?: Express.Multer.File;
  }) {
    let photoUrl: string | undefined;

    if (data.photo) {
      const result = await this.uploadService.uploadImage(data.photo, 'events') as { url: string };
      photoUrl = result.url;
    }

    const event = await this.prisma.communityEvent.create({
      data: {
        title: data.title,
        description: data.description,
        eventDate: data.eventDate,
        location: data.location,
        maxParticipants: data.maxParticipants,
        photoUrl,
        createdBy: userId,
      },
    });

    // Add creator as participant
    await this.prisma.eventParticipant.create({
      data: {
        eventId: event.id,
        userId,
      },
    });

    return event;
  }

  async joinEvent(userId: string, eventId: string) {
    const event = await this.prisma.communityEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.maxParticipants) {
      const participantCount = await this.prisma.eventParticipant.count({
        where: { eventId },
      });

      if (participantCount >= event.maxParticipants) {
        throw new BadRequestException('Event is full');
      }
    }

    const existing = await this.prisma.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Already registered for this event');
    }

    return this.prisma.eventParticipant.create({
      data: {
        eventId,
        userId,
      },
    });
  }

  async getEvents(filters?: { upcoming?: boolean; past?: boolean }) {
    const where: any = {};

    if (filters?.upcoming) {
      where.eventDate = { gte: new Date() };
    } else if (filters?.past) {
      where.eventDate = { lt: new Date() };
    }

    return this.prisma.communityEvent.findMany({
      where,
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: { eventDate: 'asc' },
    });
  }

  // Blog
  async createBlogPost(userId: string, data: {
    title: string;
    content: string;
    excerpt?: string;
    tags?: string[];
    photo?: Express.Multer.File;
  }) {
    let photoUrl: string | undefined;

    if (data.photo) {
      const result = await this.uploadService.uploadImage(data.photo, 'blog') as { url: string };
      photoUrl = result.url;
    }

    return this.prisma.blogPost.create({
      data: {
        userId,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        tags: data.tags || [],
        photoUrl,
        isPublished: false, // Requires admin approval
      },
      include: {
        user: {
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
    });
  }

  async getBlogPosts(filters?: { published?: boolean; search?: string; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.published !== undefined) {
      where.isPublished = filters.published;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        include: {
          user: {
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
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

