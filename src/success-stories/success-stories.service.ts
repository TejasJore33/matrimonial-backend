import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class SuccessStoriesService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async submitStory(userId: string, partnerId: string, title: string, story: string, weddingDate?: Date, photos?: Express.Multer.File[]) {
    // Verify partner exists
    const partner = await this.prisma.user.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      throw new NotFoundException('Partner not found');
    }

    // Check if story already exists
    const existing = await (this.prisma as any).successStory.findFirst({
      where: {
        userId,
        partnerId,
      },
    });

    if (existing) {
      throw new BadRequestException('Success story already submitted for this partner');
    }

    // Upload photos if provided
    let photoUrls: string[] = [];
    if (photos && photos.length > 0) {
      for (const photo of photos) {
        const result = await this.uploadService.uploadImage(photo, 'success-stories') as { url: string };
        photoUrls.push(result.url);
      }
    }

    return (this.prisma as any).successStory.create({
      data: {
        userId,
        partnerId,
        title,
        story,
        weddingDate,
        photos: photoUrls.length > 0 ? photoUrls : null,
        isApproved: false,
        isFeatured: false,
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

  async getStories(filters?: { approved?: boolean; featured?: boolean; limit?: number }) {
    const where: any = {};

    if (filters?.approved !== undefined) {
      where.isApproved = filters.approved;
    }

    if (filters?.featured !== undefined) {
      where.isFeatured = filters.featured;
    }

    return (this.prisma as any).successStory.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 20,
    });
  }

  async getStoryById(storyId: string) {
    const story = await (this.prisma as any).successStory.findUnique({
      where: { id: storyId },
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

    if (!story) {
      throw new NotFoundException('Success story not found');
    }

    return story;
  }

  async getUserStories(userId: string) {
    return (this.prisma as any).successStory.findMany({
      where: { userId },
      include: {
        user: {
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
    });
  }

  async approveStory(storyId: string, adminId: string) {
    const story = await (this.prisma as any).successStory.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Success story not found');
    }

    return (this.prisma as any).successStory.update({
      where: { id: storyId },
      data: {
        isApproved: true,
      },
    });
  }

  async featureStory(storyId: string, adminId: string) {
    const story = await (this.prisma as any).successStory.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Success story not found');
    }

    if (!story.isApproved) {
      throw new BadRequestException('Story must be approved before featuring');
    }

    return (this.prisma as any).successStory.update({
      where: { id: storyId },
      data: {
        isFeatured: true,
      },
    });
  }

  async deleteStory(storyId: string, userId: string, isAdmin: boolean = false) {
    const story = await (this.prisma as any).successStory.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Success story not found');
    }

    if (!isAdmin && story.userId !== userId) {
      throw new ForbiddenException('You can only delete your own stories');
    }

    // Delete photos from storage
    if (story.photos && Array.isArray(story.photos)) {
      for (const photoUrlItem of story.photos) {
        try {
          // Ensure photoUrl is a string
          const photoUrl = typeof photoUrlItem === 'string' ? photoUrlItem : String(photoUrlItem);
          // Extract publicId from URL or use the URL itself
          const publicId = photoUrl.split('/').pop()?.split('.')[0] || photoUrl;
          await this.uploadService.deleteImage(publicId);
        } catch (error) {
          // Continue even if deletion fails
          console.error('Failed to delete photo:', photoUrlItem);
        }
      }
    }

    await (this.prisma as any).successStory.delete({
      where: { id: storyId },
    });

    return { message: 'Success story deleted' };
  }

  /**
   * Get featured success stories (gallery)
   */
  async getFeaturedStories(limit: number = 10) {
    return (this.prisma as any).successStory.findMany({
      where: {
        isApproved: true,
        isFeatured: true,
      },
      include: {
        user: {
          select: {
            id: true,
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
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get success stories by filters (region, religion, etc.)
   */
  async getStoriesByFilters(filters: {
    region?: string;
    religion?: string;
    limit?: number;
    page?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      isApproved: true,
    };

    // Note: Would need to join with Profile to filter by region/religion
    // For now, return all approved stories

    const [stories, total] = await Promise.all([
      (this.prisma as any).successStory.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  city: true,
                  state: true,
                  religion: true,
                  photos: {
                    where: { isPrimary: true },
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
      (this.prisma as any).successStory.count({ where }),
    ]);

    // Filter by region/religion if provided (client-side filtering for now)
    let filteredStories = stories;
    if (filters.region) {
      filteredStories = filteredStories.filter(
        (story) =>
          story.user.profile?.city?.toLowerCase().includes(filters.region!.toLowerCase()) ||
          story.user.profile?.state?.toLowerCase().includes(filters.region!.toLowerCase()),
      );
    }
    if (filters.religion) {
      filteredStories = filteredStories.filter(
        (story) => story.user.profile?.religion?.toLowerCase() === filters.religion!.toLowerCase(),
      );
    }

    return {
      stories: filteredStories,
      total: filteredStories.length,
      page,
      limit,
    };
  }

  /**
   * Get success story statistics
   */
  async getStoryStats() {
    const [total, approved, featured, thisMonth] = await Promise.all([
      (this.prisma as any).successStory.count(),
      (this.prisma as any).successStory.count({ where: { isApproved: true } }),
      (this.prisma as any).successStory.count({ where: { isFeatured: true } }),
      (this.prisma as any).successStory.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      total,
      approved,
      featured,
      thisMonth,
      pending: total - approved,
    };
  }
}

