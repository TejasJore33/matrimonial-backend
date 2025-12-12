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
exports.VideoCallController = void 0;
const common_1 = require("@nestjs/common");
const video_call_service_1 = require("./video-call.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let VideoCallController = class VideoCallController {
    constructor(videoCallService) {
        this.videoCallService = videoCallService;
    }
    async createInstantCall(user, body) {
        return this.videoCallService.createInstantCall(user.id, body.participantId, body.audioOnly);
    }
    async scheduleCall(user, body) {
        return this.videoCallService.scheduleCall(user.id, {
            participantId: body.participantId,
            scheduledAt: new Date(body.scheduledAt),
            duration: body.duration,
            notes: body.notes,
        });
    }
    async startCall(user, id) {
        return this.videoCallService.startCall(user.id, id);
    }
    async endCall(user, id) {
        return this.videoCallService.endCall(user.id, id);
    }
    async cancelCall(user, id) {
        return this.videoCallService.cancelCall(user.id, id);
    }
    async getCalls(user, status, type) {
        return this.videoCallService.getCalls(user.id, { status, type });
    }
    async getCallById(user, id) {
        return this.videoCallService.getCallById(user.id, id);
    }
};
exports.VideoCallController = VideoCallController;
__decorate([
    (0, common_1.Post)('instant'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VideoCallController.prototype, "createInstantCall", null);
__decorate([
    (0, common_1.Post)('schedule'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VideoCallController.prototype, "scheduleCall", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VideoCallController.prototype, "startCall", null);
__decorate([
    (0, common_1.Put)(':id/end'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VideoCallController.prototype, "endCall", null);
__decorate([
    (0, common_1.Put)(':id/cancel'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VideoCallController.prototype, "cancelCall", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], VideoCallController.prototype, "getCalls", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VideoCallController.prototype, "getCallById", null);
exports.VideoCallController = VideoCallController = __decorate([
    (0, common_1.Controller)('video-call'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [video_call_service_1.VideoCallService])
], VideoCallController);
//# sourceMappingURL=video-call.controller.js.map