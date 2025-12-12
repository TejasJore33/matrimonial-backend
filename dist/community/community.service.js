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
exports.CommunityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const upload_service_1 = require("../upload/upload.service");
let CommunityService = class CommunityService {
    constructor(prisma, uploadService) {
        this.prisma = prisma;
        this.uploadService = uploadService;
    }
    async createForumPost(userId, data) {
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
    async getForumPosts(filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
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
    async createForumComment(userId, postId, content) {
        const post = await this.prisma.forumPost.findUnique({
            where: { id: postId },
        });
        if (!post) {
            throw new common_1.NotFoundException('Forum post not found');
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
    async createGroup(userId, data) {
        let photoUrl;
        if (data.photo) {
            const result = await this.uploadService.uploadImage(data.photo, 'groups');
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
        await this.prisma.groupMember.create({
            data: {
                groupId: group.id,
                userId,
                role: 'ADMIN',
            },
        });
        return group;
    }
    async joinGroup(userId, groupId) {
        const group = await this.prisma.communityGroup.findUnique({
            where: { id: groupId },
        });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
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
            throw new common_1.BadRequestException('Already a member of this group');
        }
        return this.prisma.groupMember.create({
            data: {
                groupId,
                userId,
                role: 'MEMBER',
            },
        });
    }
    async getGroups(filters) {
        const where = {};
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
    async createEvent(userId, data) {
        let photoUrl;
        if (data.photo) {
            const result = await this.uploadService.uploadImage(data.photo, 'events');
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
        await this.prisma.eventParticipant.create({
            data: {
                eventId: event.id,
                userId,
            },
        });
        return event;
    }
    async joinEvent(userId, eventId) {
        const event = await this.prisma.communityEvent.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        if (event.maxParticipants) {
            const participantCount = await this.prisma.eventParticipant.count({
                where: { eventId },
            });
            if (participantCount >= event.maxParticipants) {
                throw new common_1.BadRequestException('Event is full');
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
            throw new common_1.BadRequestException('Already registered for this event');
        }
        return this.prisma.eventParticipant.create({
            data: {
                eventId,
                userId,
            },
        });
    }
    async getEvents(filters) {
        const where = {};
        if (filters?.upcoming) {
            where.eventDate = { gte: new Date() };
        }
        else if (filters?.past) {
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
    async createBlogPost(userId, data) {
        let photoUrl;
        if (data.photo) {
            const result = await this.uploadService.uploadImage(data.photo, 'blog');
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
                isPublished: false,
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
    async getBlogPosts(filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
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
};
exports.CommunityService = CommunityService;
exports.CommunityService = CommunityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        upload_service_1.UploadService])
], CommunityService);
//# sourceMappingURL=community.service.js.map