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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const community_service_1 = require("./community.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const admin_guard_1 = require("../common/guards/admin.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let CommunityController = class CommunityController {
    constructor(communityService) {
        this.communityService = communityService;
    }
    async createForumPost(user, body) {
        return this.communityService.createForumPost(user.id, body);
    }
    async getForumPosts(category, search, page, limit) {
        return this.communityService.getForumPosts({
            category,
            search,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
    }
    async createForumComment(user, postId, body) {
        return this.communityService.createForumComment(user.id, postId, body.content);
    }
    async createGroup(user, body, photo) {
        return this.communityService.createGroup(user.id, {
            name: body.name,
            description: body.description,
            isPublic: body.isPublic === 'true',
            photo,
        });
    }
    async getGroups(search, isPublic) {
        return this.communityService.getGroups({
            search,
            isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
        });
    }
    async joinGroup(user, groupId) {
        return this.communityService.joinGroup(user.id, groupId);
    }
    async createEvent(user, body, photo) {
        return this.communityService.createEvent(user.id, {
            title: body.title,
            description: body.description,
            eventDate: new Date(body.eventDate),
            location: body.location,
            maxParticipants: body.maxParticipants ? parseInt(body.maxParticipants) : undefined,
            photo,
        });
    }
    async getEvents(upcoming, past) {
        return this.communityService.getEvents({
            upcoming: upcoming === 'true',
            past: past === 'true',
        });
    }
    async joinEvent(user, eventId) {
        return this.communityService.joinEvent(user.id, eventId);
    }
    async createBlogPost(user, body, photo) {
        return this.communityService.createBlogPost(user.id, {
            title: body.title,
            content: body.content,
            excerpt: body.excerpt,
            tags: body.tags,
            photo,
        });
    }
    async getBlogPosts(published, search, page, limit) {
        return this.communityService.getBlogPosts({
            published: published === 'true' ? true : published === 'false' ? false : undefined,
            search,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
    }
    async publishBlogPost(id) {
        return { message: 'Blog post published' };
    }
};
exports.CommunityController = CommunityController;
__decorate([
    (0, common_1.Post)('forum'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "createForumPost", null);
__decorate([
    (0, common_1.Get)('forum'),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getForumPosts", null);
__decorate([
    (0, common_1.Post)('forum/:postId/comments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('postId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "createForumComment", null);
__decorate([
    (0, common_1.Post)('groups'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "createGroup", null);
__decorate([
    (0, common_1.Get)('groups'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('isPublic')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getGroups", null);
__decorate([
    (0, common_1.Post)('groups/:groupId/join'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "joinGroup", null);
__decorate([
    (0, common_1.Post)('events'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "createEvent", null);
__decorate([
    (0, common_1.Get)('events'),
    __param(0, (0, common_1.Query)('upcoming')),
    __param(1, (0, common_1.Query)('past')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Post)('events/:eventId/join'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "joinEvent", null);
__decorate([
    (0, common_1.Post)('blog'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "createBlogPost", null);
__decorate([
    (0, common_1.Get)('blog'),
    __param(0, (0, common_1.Query)('published')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getBlogPosts", null);
__decorate([
    (0, common_1.Post)('blog/:id/publish'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "publishBlogPost", null);
exports.CommunityController = CommunityController = __decorate([
    (0, common_1.Controller)('community'),
    __metadata("design:paramtypes", [community_service_1.CommunityService])
], CommunityController);
//# sourceMappingURL=community.controller.js.map