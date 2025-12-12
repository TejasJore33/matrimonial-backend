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
exports.ProfilesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const profiles_service_1 = require("./profiles.service");
const profile_dto_1 = require("./dto/profile.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let ProfilesController = class ProfilesController {
    constructor(profilesService) {
        this.profilesService = profilesService;
    }
    async createProfile(user, dto) {
        console.log('=== PROFILE CREATION REQUEST ===');
        console.log('User ID:', user.id);
        console.log('DTO received:', JSON.stringify(dto, null, 2));
        console.log('DTO type:', typeof dto);
        console.log('DTO keys:', Object.keys(dto));
        try {
            console.log('Calling profilesService.createProfile...');
            const result = await this.profilesService.createProfile(user.id, dto);
            console.log('Profile created successfully:', result.id);
            return result;
        }
        catch (error) {
            console.error('=== PROFILE CREATION ERROR IN CONTROLLER ===');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('Error stack:', error.stack);
            console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
            throw error;
        }
    }
    async getMyProfile(user) {
        return this.profilesService.getProfile(user.id, user.id);
    }
    async getTestimonials(user) {
        return this.profilesService.getTestimonials(user.id);
    }
    async addTestimonial(user, body) {
        const testimonialData = {
            ...body,
            rating: body.rating ? Number(body.rating) : undefined,
        };
        return this.profilesService.addTestimonial(user.id, testimonialData);
    }
    async exportProfile(user, format = 'json') {
        return this.profilesService.exportProfile(user.id, format);
    }
    async getCompleteness(user) {
        const profile = await this.profilesService.getProfile(user.id, user.id);
        if (!profile) {
            return { completenessScore: 0, suggestions: [] };
        }
        const suggestions = await this.profilesService.getCompletenessSuggestions(user.id);
        return {
            completenessScore: profile.completenessScore || 0,
            suggestions,
        };
    }
    async updateProfile(user, dto) {
        return this.profilesService.updateProfile(user.id, dto);
    }
    async getProfileViews(user, page = '1', limit = '20') {
        return this.profilesService.getProfileViews(user.id, parseInt(page), parseInt(limit));
    }
    async getProfileViewsStats(user) {
        return this.profilesService.getProfileViewsStats(user.id);
    }
    async uploadPhoto(user, file, body) {
        return this.profilesService.uploadPhoto(user.id, file, body.isPrimary === 'true');
    }
    async deletePhoto(user, photoId) {
        return this.profilesService.deletePhoto(user.id, photoId);
    }
    async setPrimaryPhoto(user, photoId) {
        return this.profilesService.setPrimaryPhoto(user.id, photoId);
    }
    async uploadVideoIntro(user, file) {
        return this.profilesService.uploadVideoIntro(user.id, file);
    }
    async uploadBiodata(user, file) {
        return this.profilesService.uploadBiodata(user.id, file);
    }
    async updatePrivacySettings(user, body) {
        return this.profilesService.updatePrivacySettings(user.id, body.settings);
    }
    async submitForApproval(user) {
        return this.profilesService.submitForApproval(user.id);
    }
    async getProfile(user, userId) {
        return this.profilesService.getProfile(userId, user.id);
    }
    async getProfileBySlug(slug) {
        return this.profilesService.getProfileBySlug(slug);
    }
    async unlockContact(user, userId) {
        return this.profilesService.unlockContact(user.id, userId);
    }
    async hideFromSearch(user, body) {
        return this.profilesService.hideFromSearch(user.id, body.hide);
    }
    async downloadUserData(user) {
        return this.profilesService.downloadUserData(user.id);
    }
    async deleteAccount(user, body) {
        return this.profilesService.deleteAccount(user.id, body?.password);
    }
    async updatePhotoAlbum(user, photoId, body) {
        return this.profilesService.updatePhotoAlbum(user.id, photoId, body.albumName, body.caption);
    }
    async getPhotosByAlbum(user, albumName) {
        return this.profilesService.getPhotosByAlbum(user.id, albumName);
    }
};
exports.ProfilesController = ProfilesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.CreateProfileDto]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "createProfile", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Get)('me/testimonials'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "getTestimonials", null);
__decorate([
    (0, common_1.Post)('me/testimonials'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "addTestimonial", null);
__decorate([
    (0, common_1.Get)('me/export'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "exportProfile", null);
__decorate([
    (0, common_1.Get)('me/completeness'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "getCompleteness", null);
__decorate([
    (0, common_1.Put)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('me/views'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "getProfileViews", null);
__decorate([
    (0, common_1.Get)('me/views/stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "getProfileViewsStats", null);
__decorate([
    (0, common_1.Post)('me/photos'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "uploadPhoto", null);
__decorate([
    (0, common_1.Delete)('me/photos/:photoId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('photoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "deletePhoto", null);
__decorate([
    (0, common_1.Put)('me/photos/:photoId/primary'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('photoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "setPrimaryPhoto", null);
__decorate([
    (0, common_1.Post)('me/video-intro'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "uploadVideoIntro", null);
__decorate([
    (0, common_1.Post)('me/biodata'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "uploadBiodata", null);
__decorate([
    (0, common_1.Put)('me/privacy'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "updatePrivacySettings", null);
__decorate([
    (0, common_1.Post)('me/submit'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "submitForApproval", null);
__decorate([
    (0, common_1.Get)(':userId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('slug/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "getProfileBySlug", null);
__decorate([
    (0, common_1.Post)(':userId/unlock-contact'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "unlockContact", null);
__decorate([
    (0, common_1.Put)('me/hide-from-search'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "hideFromSearch", null);
__decorate([
    (0, common_1.Get)('me/download-data'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "downloadUserData", null);
__decorate([
    (0, common_1.Delete)('me/account'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "deleteAccount", null);
__decorate([
    (0, common_1.Put)('me/photos/:photoId/album'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('photoId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "updatePhotoAlbum", null);
__decorate([
    (0, common_1.Get)('me/photos/albums'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('album')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "getPhotosByAlbum", null);
exports.ProfilesController = ProfilesController = __decorate([
    (0, common_1.Controller)('profiles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [profiles_service_1.ProfilesService])
], ProfilesController);
//# sourceMappingURL=profiles.controller.js.map