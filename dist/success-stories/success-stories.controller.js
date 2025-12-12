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
exports.SuccessStoriesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const success_stories_service_1 = require("./success-stories.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const admin_guard_1 = require("../common/guards/admin.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let SuccessStoriesController = class SuccessStoriesController {
    constructor(successStoriesService) {
        this.successStoriesService = successStoriesService;
    }
    async submitStory(user, body, photos) {
        const weddingDate = body.weddingDate ? new Date(body.weddingDate) : undefined;
        return this.successStoriesService.submitStory(user.id, body.partnerId, body.title, body.story, weddingDate, photos);
    }
    async getStories(approved, featured, limit, region, religion, page) {
        if (featured === 'true') {
            return this.successStoriesService.getFeaturedStories(limit ? parseInt(limit) : 10);
        }
        if (region || religion) {
            return this.successStoriesService.getStoriesByFilters({
                region,
                religion,
                limit: limit ? parseInt(limit) : undefined,
                page: page ? parseInt(page) : undefined,
            });
        }
        return this.successStoriesService.getStories({
            approved: approved === 'true' ? true : approved === 'false' ? false : undefined,
            featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
    }
    async getFeaturedStories(limit) {
        return this.successStoriesService.getFeaturedStories(limit ? parseInt(limit) : 10);
    }
    async getStoryStats() {
        return this.successStoriesService.getStoryStats();
    }
    async getUserStories(user) {
        return this.successStoriesService.getUserStories(user.id);
    }
    async getStoryById(id) {
        return this.successStoriesService.getStoryById(id);
    }
    async approveStory(user, id) {
        return this.successStoriesService.approveStory(id, user.id);
    }
    async featureStory(user, id) {
        return this.successStoriesService.featureStory(id, user.id);
    }
    async deleteStory(user, id) {
        const isAdmin = user.role === 'ADMIN';
        return this.successStoriesService.deleteStory(id, user.id, isAdmin);
    }
};
exports.SuccessStoriesController = SuccessStoriesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('photos', 10)),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Array]),
    __metadata("design:returntype", Promise)
], SuccessStoriesController.prototype, "submitStory", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('approved')),
    __param(1, (0, common_1.Query)('featured')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('region')),
    __param(4, (0, common_1.Query)('religion')),
    __param(5, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SuccessStoriesController.prototype, "getStories", null);
__decorate([
    (0, common_1.Get)('featured'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuccessStoriesController.prototype, "getFeaturedStories", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuccessStoriesController.prototype, "getStoryStats", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuccessStoriesController.prototype, "getUserStories", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuccessStoriesController.prototype, "getStoryById", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SuccessStoriesController.prototype, "approveStory", null);
__decorate([
    (0, common_1.Post)(':id/feature'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SuccessStoriesController.prototype, "featureStory", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SuccessStoriesController.prototype, "deleteStory", null);
exports.SuccessStoriesController = SuccessStoriesController = __decorate([
    (0, common_1.Controller)('success-stories'),
    __metadata("design:paramtypes", [success_stories_service_1.SuccessStoriesService])
], SuccessStoriesController);
//# sourceMappingURL=success-stories.controller.js.map