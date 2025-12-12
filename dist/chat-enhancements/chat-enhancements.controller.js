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
exports.ChatEnhancementsController = void 0;
const common_1 = require("@nestjs/common");
const chat_enhancements_service_1 = require("./chat-enhancements.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let ChatEnhancementsController = class ChatEnhancementsController {
    constructor(chatEnhancementsService) {
        this.chatEnhancementsService = chatEnhancementsService;
    }
    async getMessageTemplates(user, category) {
        return this.chatEnhancementsService.getMessageTemplates(user.id, category);
    }
    async createMessageTemplate(user, body) {
        return this.chatEnhancementsService.createMessageTemplate(user.id, body.name, body.content, body.category);
    }
    async updateMessageTemplate(user, id, body) {
        return this.chatEnhancementsService.updateMessageTemplate(user.id, id, body.name, body.content, body.category);
    }
    async deleteMessageTemplate(user, id) {
        return this.chatEnhancementsService.deleteMessageTemplate(user.id, id);
    }
    async getIceBreakers(user, profileId) {
        return this.chatEnhancementsService.getIceBreakers(user.id, profileId);
    }
    async saveIceBreaker(user, profileId, body) {
        return this.chatEnhancementsService.saveIceBreaker(user.id, profileId, body.question, body.answer);
    }
    async getChatReminders(user) {
        return this.chatEnhancementsService.getChatReminders(user.id);
    }
};
exports.ChatEnhancementsController = ChatEnhancementsController;
__decorate([
    (0, common_1.Get)('templates'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatEnhancementsController.prototype, "getMessageTemplates", null);
__decorate([
    (0, common_1.Post)('templates'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatEnhancementsController.prototype, "createMessageTemplate", null);
__decorate([
    (0, common_1.Put)('templates/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ChatEnhancementsController.prototype, "updateMessageTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatEnhancementsController.prototype, "deleteMessageTemplate", null);
__decorate([
    (0, common_1.Get)('ice-breakers/:profileId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('profileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatEnhancementsController.prototype, "getIceBreakers", null);
__decorate([
    (0, common_1.Post)('ice-breakers/:profileId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('profileId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ChatEnhancementsController.prototype, "saveIceBreaker", null);
__decorate([
    (0, common_1.Get)('reminders'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatEnhancementsController.prototype, "getChatReminders", null);
exports.ChatEnhancementsController = ChatEnhancementsController = __decorate([
    (0, common_1.Controller)('chat-enhancements'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [chat_enhancements_service_1.ChatEnhancementsService])
], ChatEnhancementsController);
//# sourceMappingURL=chat-enhancements.controller.js.map