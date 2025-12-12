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
exports.VerifyPaymentDto = exports.CreateAddOnDto = exports.CreateSubscriptionDto = void 0;
const class_validator_1 = require("class-validator");
class CreateSubscriptionDto {
}
exports.CreateSubscriptionDto = CreateSubscriptionDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Plan is required' }),
    (0, class_validator_1.IsEnum)(['PREMIUM', 'PARENT', 'GOLD_3M', 'GOLD_PLUS_3M', 'DIAMOND_6M', 'DIAMOND_PLUS_6M', 'PLATINUM_PLUS_12M'], {
        message: 'Invalid plan selected',
    }),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "plan", void 0);
class CreateAddOnDto {
}
exports.CreateAddOnDto = CreateAddOnDto;
__decorate([
    (0, class_validator_1.IsEnum)(['PROFILE_BOOST', 'VERIFIED_BADGE', 'HOROSCOPE_REPORT']),
    __metadata("design:type", String)
], CreateAddOnDto.prototype, "type", void 0);
class VerifyPaymentDto {
}
exports.VerifyPaymentDto = VerifyPaymentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "paymentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpayPaymentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpaySignature", void 0);
//# sourceMappingURL=payment.dto.js.map