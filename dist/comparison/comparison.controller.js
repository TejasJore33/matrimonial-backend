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
exports.ComparisonController = void 0;
const common_1 = require("@nestjs/common");
const comparison_service_1 = require("./comparison.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let ComparisonController = class ComparisonController {
    constructor(comparisonService) {
        this.comparisonService = comparisonService;
    }
    async compareProfiles(user, body) {
        if (body.includeMatchScores) {
            return this.comparisonService.getComparisonWithMatchScores(user.id, body.profileIds);
        }
        return this.comparisonService.compareProfiles(user.id, body.profileIds);
    }
    async getComparisonHistory(user) {
        return this.comparisonService.getComparisonHistory(user.id);
    }
    async getSavedComparisons(user) {
        return this.comparisonService.getSavedComparisons(user.id);
    }
    async deleteComparison(user, profileId) {
        return this.comparisonService.deleteComparison(user.id, profileId);
    }
};
exports.ComparisonController = ComparisonController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ComparisonController.prototype, "compareProfiles", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ComparisonController.prototype, "getComparisonHistory", null);
__decorate([
    (0, common_1.Get)('saved'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ComparisonController.prototype, "getSavedComparisons", null);
__decorate([
    (0, common_1.Delete)(':profileId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('profileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ComparisonController.prototype, "deleteComparison", null);
exports.ComparisonController = ComparisonController = __decorate([
    (0, common_1.Controller)('comparison'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [comparison_service_1.ComparisonService])
], ComparisonController);
//# sourceMappingURL=comparison.controller.js.map