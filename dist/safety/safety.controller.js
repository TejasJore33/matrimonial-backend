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
exports.SafetyController = void 0;
const common_1 = require("@nestjs/common");
const safety_service_1 = require("./safety.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let SafetyController = class SafetyController {
    constructor(safetyService) {
        this.safetyService = safetyService;
    }
    async reportUser(user, body) {
        return this.safetyService.reportUser(user.id, body.reportedUserId, body.type, body.reason, body.description, body.messageId, body.photoId);
    }
    async getSafetyTips() {
        return this.safetyService.getSafetyTips();
    }
    async getBlockedUsers(user) {
        return this.safetyService.getBlockedUsers(user.id);
    }
    async getUserReports(user) {
        return this.safetyService.getUserReports(user.id);
    }
    async getSafetyStats(user) {
        return this.safetyService.getSafetyStats(user.id);
    }
};
exports.SafetyController = SafetyController;
__decorate([
    (0, common_1.Post)('report'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SafetyController.prototype, "reportUser", null);
__decorate([
    (0, common_1.Get)('tips'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SafetyController.prototype, "getSafetyTips", null);
__decorate([
    (0, common_1.Get)('blocked'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SafetyController.prototype, "getBlockedUsers", null);
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SafetyController.prototype, "getUserReports", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SafetyController.prototype, "getSafetyStats", null);
exports.SafetyController = SafetyController = __decorate([
    (0, common_1.Controller)('safety'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [safety_service_1.SafetyService])
], SafetyController);
//# sourceMappingURL=safety.controller.js.map