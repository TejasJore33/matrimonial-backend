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
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const search_service_1 = require("./search.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let SearchController = class SearchController {
    constructor(searchService) {
        this.searchService = searchService;
    }
    async search(user, query, page = '1', limit = '20', sortBy, activity) {
        const filters = {};
        const arrayFields = ['religions', 'castes', 'motherTongue', 'cities', 'states', 'countries', 'educations', 'occupations', 'maritalStatuses', 'diets', 'familyTypes'];
        arrayFields.forEach(field => {
            if (query[field]) {
                filters[field] = Array.isArray(query[field]) ? query[field] : [query[field]];
            }
        });
        if (query.gender)
            filters.gender = query.gender;
        if (query.minAge)
            filters.minAge = parseInt(query.minAge);
        if (query.maxAge)
            filters.maxAge = parseInt(query.maxAge);
        if (query.minHeight)
            filters.minHeight = parseInt(query.minHeight);
        if (query.maxHeight)
            filters.maxHeight = parseInt(query.maxHeight);
        if (query.religion)
            filters.religion = query.religion;
        if (query.caste)
            filters.caste = query.caste;
        if (query.city)
            filters.city = query.city;
        if (query.state)
            filters.state = query.state;
        if (query.education)
            filters.education = query.education;
        if (query.minIncome)
            filters.minIncome = parseInt(query.minIncome);
        if (query.maxIncome)
            filters.maxIncome = parseInt(query.maxIncome);
        if (query.manglik !== undefined)
            filters.manglik = query.manglik === 'true' || query.manglik === true;
        if (query.withPhoto !== undefined)
            filters.withPhoto = query.withPhoto === 'true' || query.withPhoto === true;
        if (query.verifiedOnly !== undefined)
            filters.verifiedOnly = query.verifiedOnly === 'true' || query.verifiedOnly === true;
        if (query.workingAbroad !== undefined)
            filters.workingAbroad = query.workingAbroad === 'true' || query.workingAbroad === true;
        if (query.nri !== undefined)
            filters.nri = query.nri === 'true' || query.nri === true;
        if (query.smoking !== undefined)
            filters.smoking = query.smoking === 'true' || query.smoking === true;
        if (query.drinking !== undefined)
            filters.drinking = query.drinking === 'true' || query.drinking === true;
        this.searchService.saveSearchHistory(user.id, undefined, filters).catch(() => { });
        if (activity) {
            return this.searchService.searchByActivity(user.id, filters, activity, parseInt(page), parseInt(limit));
        }
        if (sortBy) {
            return this.searchService.searchWithSort(user.id, filters, sortBy, parseInt(page), parseInt(limit));
        }
        return this.searchService.search(user.id, filters, parseInt(page), parseInt(limit));
    }
    async getRecentlyJoined(user, limit = '20') {
        return this.searchService.getRecentlyJoined(user.id, parseInt(limit));
    }
    async getPremiumProfiles(user, limit = '20') {
        return this.searchService.getPremiumProfiles(user.id, parseInt(limit));
    }
    async getSearchHistory(user, limit = '20') {
        return this.searchService.getSearchHistory(user.id, parseInt(limit));
    }
    async getDailyMatches(user, limit = '20') {
        return this.searchService.getDailyMatches(user.id, parseInt(limit));
    }
    async saveSearch(user, body) {
        return this.searchService.saveSearch(user.id, body.name, body.filters);
    }
    async getSavedSearches(user) {
        return this.searchService.getSavedSearches(user.id);
    }
    async deleteSavedSearch(user, id) {
        return this.searchService.deleteSavedSearch(user.id, id);
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('sortBy')),
    __param(5, (0, common_1.Query)('activity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('recently-joined'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getRecentlyJoined", null);
__decorate([
    (0, common_1.Get)('premium'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getPremiumProfiles", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getSearchHistory", null);
__decorate([
    (0, common_1.Get)('daily-matches'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getDailyMatches", null);
__decorate([
    (0, common_1.Post)('saved'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "saveSearch", null);
__decorate([
    (0, common_1.Get)('saved'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getSavedSearches", null);
__decorate([
    (0, common_1.Delete)('saved/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "deleteSavedSearch", null);
exports.SearchController = SearchController = __decorate([
    (0, common_1.Controller)('search'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [search_service_1.SearchService])
], SearchController);
//# sourceMappingURL=search.controller.js.map