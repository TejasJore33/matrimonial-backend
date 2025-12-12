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
exports.InterestsController = void 0;
const common_1 = require("@nestjs/common");
const interests_service_1 = require("./interests.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let InterestsController = class InterestsController {
    constructor(interestsService) {
        this.interestsService = interestsService;
    }
    async sendInterest(user, body) {
        return this.interestsService.sendInterest(user.id, body.toUserId, body.message);
    }
    async acceptInterest(user, id) {
        return this.interestsService.acceptInterest(user.id, id);
    }
    async rejectInterest(user, id) {
        return this.interestsService.rejectInterest(user.id, id);
    }
    async getReceivedInterests(user) {
        return this.interestsService.getReceivedInterests(user.id);
    }
    async getSentInterests(user) {
        return this.interestsService.getSentInterests(user.id);
    }
    async getMatches(user) {
        return this.interestsService.getMatches(user.id);
    }
    async withdrawInterest(user, id) {
        return this.interestsService.withdrawInterest(user.id, id);
    }
    async sendBulkInterests(user, body) {
        return this.interestsService.sendBulkInterests(user.id, body.userIds, body.message);
    }
    async getInterestHistory(user, status, type) {
        return this.interestsService.getInterestHistory(user.id, { status, type });
    }
    async getPendingInterestsReminder(user) {
        return this.interestsService.getPendingInterestsReminder(user.id);
    }
    async getInterestStats(user) {
        return this.interestsService.getInterestStats(user.id);
    }
};
exports.InterestsController = InterestsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InterestsController.prototype, "sendInterest", null);
__decorate([
    (0, common_1.Put)(':id/accept'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InterestsController.prototype, "acceptInterest", null);
__decorate([
    (0, common_1.Put)(':id/reject'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InterestsController.prototype, "rejectInterest", null);
__decorate([
    (0, common_1.Get)('received'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InterestsController.prototype, "getReceivedInterests", null);
__decorate([
    (0, common_1.Get)('sent'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InterestsController.prototype, "getSentInterests", null);
__decorate([
    (0, common_1.Get)('matches'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InterestsController.prototype, "getMatches", null);
__decorate([
    (0, common_1.Put)(':id/withdraw'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InterestsController.prototype, "withdrawInterest", null);
__decorate([
    (0, common_1.Post)('bulk'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InterestsController.prototype, "sendBulkInterests", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], InterestsController.prototype, "getInterestHistory", null);
__decorate([
    (0, common_1.Get)('reminders'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InterestsController.prototype, "getPendingInterestsReminder", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InterestsController.prototype, "getInterestStats", null);
exports.InterestsController = InterestsController = __decorate([
    (0, common_1.Controller)('interests'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [interests_service_1.InterestsService])
], InterestsController);
//# sourceMappingURL=interests.controller.js.map