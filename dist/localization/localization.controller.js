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
exports.LocalizationController = void 0;
const common_1 = require("@nestjs/common");
const localization_service_1 = require("./localization.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let LocalizationController = class LocalizationController {
    constructor(localizationService) {
        this.localizationService = localizationService;
    }
    async getSupportedLanguages() {
        return this.localizationService.getSupportedLanguages();
    }
    async getTranslations(lang = 'en') {
        return this.localizationService.getTranslations(lang);
    }
    async translate(key, lang = 'en') {
        return { key, translation: await this.localizationService.translate(key, lang) };
    }
    async convertCurrency(amount, from, to) {
        return {
            amount: parseFloat(amount),
            from,
            to,
            converted: await this.localizationService.convertCurrency(parseFloat(amount), from, to),
        };
    }
    async getUserLanguage(user) {
        return { language: await this.localizationService.getUserLanguage(user.id) };
    }
    async setUserLanguage(user, body) {
        await this.localizationService.setUserLanguage(user.id, body.language);
        return { message: 'Language preference updated' };
    }
};
exports.LocalizationController = LocalizationController;
__decorate([
    (0, common_1.Get)('languages'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LocalizationController.prototype, "getSupportedLanguages", null);
__decorate([
    (0, common_1.Get)('translations'),
    __param(0, (0, common_1.Query)('lang')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LocalizationController.prototype, "getTranslations", null);
__decorate([
    (0, common_1.Get)('translate/:key'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Query)('lang')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LocalizationController.prototype, "translate", null);
__decorate([
    (0, common_1.Get)('currency/convert'),
    __param(0, (0, common_1.Query)('amount')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], LocalizationController.prototype, "convertCurrency", null);
__decorate([
    (0, common_1.Get)('user-language'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocalizationController.prototype, "getUserLanguage", null);
__decorate([
    (0, common_1.Post)('user-language'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LocalizationController.prototype, "setUserLanguage", null);
exports.LocalizationController = LocalizationController = __decorate([
    (0, common_1.Controller)('localization'),
    __metadata("design:paramtypes", [localization_service_1.LocalizationService])
], LocalizationController);
//# sourceMappingURL=localization.controller.js.map