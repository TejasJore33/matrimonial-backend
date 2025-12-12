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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleBookingDto = exports.RateServiceDto = exports.UpdateServiceStatusDto = exports.BookServiceDto = void 0;
const class_validator_1 = require("class-validator");
class BookServiceDto {
}
exports.BookServiceDto = BookServiceDto;
__decorate([
    (0, class_validator_1.IsEnum)([
        'PREMIUM_PHOTO_EDITING',
        'VIDEO_PROFILE_CREATION',
        'PROFILE_WRITING_SERVICE',
        'BIODATA_DESIGN',
        'PERSONAL_MATCHMAKER',
        'RELATIONSHIP_COUNSELING',
        'FAMILY_CONSULTATION',
        'COMPATIBILITY_ANALYSIS',
        'BACKGROUND_VERIFICATION',
        'INCOME_VERIFICATION',
        'FAMILY_VERIFICATION',
        'PHOTO_VERIFICATION',
        'VOICE_CALL_CREDITS',
        'VIDEO_CALL_CREDITS',
        'MESSAGE_TRANSLATION',
        'CALL_ASSISTANCE',
        'VIRTUAL_SPEED_DATING',
        'COMMUNITY_MEETUP',
        'WEDDING_PLANNING',
        'VENUE_RECOMMENDATIONS',
        'DETAILED_HOROSCOPE_MATCHING',
        'KUNDALI_GENERATION',
        'MUHURAT_SELECTION',
        'ASTROLOGY_CONSULTATION',
        'ADVANCED_SEARCH_FILTERS',
        'REVERSE_SEARCH',
        'PROFILE_ANALYTICS',
        'MATCH_PREDICTIONS',
        'ID_VERIFICATION',
        'SAFE_MEETING_ASSISTANCE',
        'EMERGENCY_SUPPORT',
        'PRIVACY_PROTECTION',
        'GIFT_SUBSCRIPTION',
        'PROFILE_HIGHLIGHTING',
        'FEATURED_PROFILE',
        'PRIORITY_LISTING',
        'PRE_WEDDING_PHOTOGRAPHY',
        'WEDDING_VENDOR_RECOMMENDATIONS',
        'LEGAL_DOCUMENTATION_HELP',
        'POST_MARRIAGE_SUPPORT',
        'NRI_MATCHMAKING',
        'SECOND_MARRIAGE_SUPPORT',
        'REGIONAL_LANGUAGE_SUPPORT',
    ]),
    __metadata("design:type", String)
], BookServiceDto.prototype, "serviceType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], BookServiceDto.prototype, "scheduledAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookServiceDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], BookServiceDto.prototype, "metadata", void 0);
class UpdateServiceStatusDto {
}
exports.UpdateServiceStatusDto = UpdateServiceStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED']),
    __metadata("design:type", String)
], UpdateServiceStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateServiceStatusDto.prototype, "notes", void 0);
class RateServiceDto {
}
exports.RateServiceDto = RateServiceDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], RateServiceDto.prototype, "rating", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RateServiceDto.prototype, "review", void 0);
class ScheduleBookingDto {
}
exports.ScheduleBookingDto = ScheduleBookingDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ScheduleBookingDto.prototype, "scheduledAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], ScheduleBookingDto.prototype, "duration", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScheduleBookingDto.prototype, "notes", void 0);
//# sourceMappingURL=service.dto.js.map