"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const twilio = __importStar(require("twilio"));
let SmsService = SmsService_1 = class SmsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SmsService_1.name);
        const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
        this.fromNumber = this.configService.get('TWILIO_PHONE_NUMBER', '');
        if (accountSid && authToken && accountSid.trim().startsWith('AC')) {
            try {
                this.client = twilio(accountSid.trim(), authToken.trim());
                this.logger.log('Twilio SMS service initialized successfully');
            }
            catch (error) {
                this.logger.warn('Failed to initialize Twilio client. SMS sending will be disabled.', error);
                this.client = null;
            }
        }
        else {
            this.logger.warn('Twilio credentials not configured or invalid. SMS sending will be disabled.');
            this.client = null;
        }
    }
    async sendSms(to, message) {
        if (!this.client || !this.fromNumber) {
            this.logger.warn(`SMS not sent to ${to}: Twilio not configured`);
            return false;
        }
        try {
            const cleanTo = to.replace(/[^\d+]/g, '');
            const result = await this.client.messages.create({
                body: message,
                from: this.fromNumber,
                to: cleanTo,
            });
            this.logger.log(`SMS sent successfully to ${to}: ${result.sid}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send SMS to ${to}:`, error);
            return false;
        }
    }
    async sendOtpSms(mobile, code) {
        const message = `Your OTP verification code is ${code}. This code will expire in 10 minutes. Do not share this code with anyone.`;
        return this.sendSms(mobile, message);
    }
    async sendNotificationSms(mobile, message) {
        return this.sendSms(mobile, message);
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SmsService);
//# sourceMappingURL=sms.service.js.map