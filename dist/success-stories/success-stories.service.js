"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuccessStoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const upload_service_1 = require("../upload/upload.service");
let SuccessStoriesService = class SuccessStoriesService {
    constructor(prisma, uploadService) {
        this.prisma = prisma;
        this.uploadService = uploadService;
    }
    async submitStory(userId, partnerId, title, story, weddingDate, photos) {
        const partner = await this.prisma.user.findUnique({
            where: { id: partnerId },
        });
        if (!partner) {
            throw new common_1.NotFoundException('Partner not found');
        }
        const existing = await this.prisma.successStory.findFirst({
            where: {
                userId,
                partnerId,
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Success story already submitted for this partner');
        }
        let photoUrls = [];
        if (photos && photos.length > 0) {
            for (const photo of photos) {
                const result = await this.uploadService.uploadImage(photo, 'success-stories');
                photoUrls.push(result.url);
            }
        }
        return this.prisma.successStory.create({
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
    async getStories(filters) {
        const where = {};
        if (filters?.approved !== undefined) {
            where.isApproved = filters.approved;
        }
        if (filters?.featured !== undefined) {
            where.isFeatured = filters.featured;
        }
        return this.prisma.successStory.findMany({
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
    async getStoryById(storyId) {
        const story = await this.prisma.successStory.findUnique({
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
            throw new common_1.NotFoundException('Success story not found');
        }
        return story;
    }
    async getUserStories(userId) {
        return this.prisma.successStory.findMany({
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
    async approveStory(storyId, adminId) {
        const story = await this.prisma.successStory.findUnique({
            where: { id: storyId },
        });
        if (!story) {
            throw new common_1.NotFoundException('Success story not found');
        }
        return this.prisma.successStory.update({
            where: { id: storyId },
            data: {
                isApproved: true,
            },
        });
    }
    async featureStory(storyId, adminId) {
        const story = await this.prisma.successStory.findUnique({
            where: { id: storyId },
        });
        if (!story) {
            throw new common_1.NotFoundException('Success story not found');
        }
        if (!story.isApproved) {
            throw new common_1.BadRequestException('Story must be approved before featuring');
        }
        return this.prisma.successStory.update({
            where: { id: storyId },
            data: {
                isFeatured: true,
            },
        });
    }
    async deleteStory(storyId, userId, isAdmin = false) {
        const story = await this.prisma.successStory.findUnique({
            where: { id: storyId },
        });
        if (!story) {
            throw new common_1.NotFoundException('Success story not found');
        }
        if (!isAdmin && story.userId !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own stories');
        }
        if (story.photos && Array.isArray(story.photos)) {
            for (const photoUrlItem of story.photos) {
                try {
                    const photoUrl = typeof photoUrlItem === 'string' ? photoUrlItem : String(photoUrlItem);
                    const publicId = photoUrl.split('/').pop()?.split('.')[0] || photoUrl;
                    await this.uploadService.deleteImage(publicId);
                }
                catch (error) {
                    console.error('Failed to delete photo:', photoUrlItem);
                }
            }
        }
        await this.prisma.successStory.delete({
            where: { id: storyId },
        });
        return { message: 'Success story deleted' };
    }
    async getFeaturedStories(limit = 10) {
        return this.prisma.successStory.findMany({
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
    async getStoriesByFilters(filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const where = {
            isApproved: true,
        };
        const [stories, total] = await Promise.all([
            this.prisma.successStory.findMany({
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
            this.prisma.successStory.count({ where }),
        ]);
        let filteredStories = stories;
        if (filters.region) {
            filteredStories = filteredStories.filter((story) => story.user.profile?.city?.toLowerCase().includes(filters.region.toLowerCase()) ||
                story.user.profile?.state?.toLowerCase().includes(filters.region.toLowerCase()));
        }
        if (filters.religion) {
            filteredStories = filteredStories.filter((story) => story.user.profile?.religion?.toLowerCase() === filters.religion.toLowerCase());
        }
        return {
            stories: filteredStories,
            total: filteredStories.length,
            page,
            limit,
        };
    }
    async getStoryStats() {
        const [total, approved, featured, thisMonth] = await Promise.all([
            this.prisma.successStory.count(),
            this.prisma.successStory.count({ where: { isApproved: true } }),
            this.prisma.successStory.count({ where: { isFeatured: true } }),
            this.prisma.successStory.count({
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
};
exports.SuccessStoriesService = SuccessStoriesService;
exports.SuccessStoriesService = SuccessStoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        upload_service_1.UploadService])
], SuccessStoriesService);
//# sourceMappingURL=success-stories.service.js.map