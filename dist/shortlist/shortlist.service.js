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
exports.ShortlistService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ShortlistService = class ShortlistService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addToShortlist(userId, profileId, folderName, notes) {
        const profile = await this.prisma.profile.findUnique({
            where: { id: profileId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const existing = await this.prisma.shortlist.findUnique({
            where: {
                userId_profileId: {
                    userId,
                    profileId,
                },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Profile already in shortlist');
        }
        return this.prisma.shortlist.create({
            data: {
                userId,
                profileId,
                folderName: folderName || 'Default',
                notes,
            },
            include: {
                profile: {
                    include: {
                        photos: {
                            where: { isPrimary: true },
                            take: 1,
                        },
                        user: {
                            select: {
                                id: true,
                                email: true,
                                mobile: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async removeFromShortlist(userId, profileId) {
        const shortlist = await this.prisma.shortlist.findUnique({
            where: {
                userId_profileId: {
                    userId,
                    profileId,
                },
            },
        });
        if (!shortlist) {
            throw new common_1.NotFoundException('Profile not in shortlist');
        }
        await this.prisma.shortlist.delete({
            where: {
                userId_profileId: {
                    userId,
                    profileId,
                },
            },
        });
        return { message: 'Removed from shortlist' };
    }
    async getShortlist(userId, folderName) {
        const where = { userId };
        if (folderName) {
            where.folderName = folderName;
        }
        return this.prisma.shortlist.findMany({
            where,
            include: {
                profile: {
                    include: {
                        photos: {
                            where: { isPrimary: true },
                            take: 1,
                        },
                        user: {
                            select: {
                                id: true,
                                email: true,
                                mobile: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async updateShortlist(userId, profileId, folderName, notes) {
        const shortlist = await this.prisma.shortlist.findUnique({
            where: {
                userId_profileId: {
                    userId,
                    profileId,
                },
            },
        });
        if (!shortlist) {
            throw new common_1.NotFoundException('Profile not in shortlist');
        }
        return this.prisma.shortlist.update({
            where: {
                userId_profileId: {
                    userId,
                    profileId,
                },
            },
            data: {
                ...(folderName && { folderName }),
                ...(notes !== undefined && { notes }),
            },
            include: {
                profile: {
                    include: {
                        photos: {
                            where: { isPrimary: true },
                            take: 1,
                        },
                    },
                },
            },
        });
    }
    async getShortlistFolders(userId) {
        const folders = await this.prisma.shortlist.findMany({
            where: { userId },
            select: {
                folderName: true,
            },
            distinct: ['folderName'],
        });
        return folders.map(f => f.folderName);
    }
    async isShortlisted(userId, profileId) {
        const shortlist = await this.prisma.shortlist.findUnique({
            where: {
                userId_profileId: {
                    userId,
                    profileId,
                },
            },
        });
        return !!shortlist;
    }
};
exports.ShortlistService = ShortlistService;
exports.ShortlistService = ShortlistService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShortlistService);
//# sourceMappingURL=shortlist.service.js.map