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
var PushService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const admin = __importStar(require("firebase-admin"));
let PushService = PushService_1 = class PushService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(PushService_1.name);
        this.initialized = false;
        this.initializeFirebase();
    }
    initializeFirebase() {
        try {
            const serviceAccount = this.configService.get('FIREBASE_SERVICE_ACCOUNT');
            if (!serviceAccount) {
                this.logger.warn('Firebase service account not configured. Push notifications will be disabled.');
                return;
            }
            const serviceAccountJson = JSON.parse(serviceAccount);
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccountJson),
                });
            }
            this.initialized = true;
            this.logger.log('Firebase Admin initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize Firebase Admin:', error);
        }
    }
    async sendPushNotification(fcmToken, title, body, data) {
        if (!this.initialized) {
            this.logger.warn('Push notification not sent: Firebase not initialized');
            return false;
        }
        try {
            const message = {
                token: fcmToken,
                notification: {
                    title,
                    body,
                },
                data: data ? this.convertDataToStrings(data) : undefined,
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        channelId: 'default',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
            };
            const response = await admin.messaging().send(message);
            this.logger.log(`Push notification sent successfully: ${response}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send push notification to ${fcmToken}:`, error);
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
                this.logger.warn(`Invalid FCM token: ${fcmToken}`);
            }
            return false;
        }
    }
    async sendPushNotificationToMultiple(fcmTokens, title, body, data) {
        if (!this.initialized || fcmTokens.length === 0) {
            return { successCount: 0, failureCount: fcmTokens.length };
        }
        try {
            const message = {
                tokens: fcmTokens,
                notification: {
                    title,
                    body,
                },
                data: data ? this.convertDataToStrings(data) : undefined,
                android: {
                    priority: 'high',
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                        },
                    },
                },
            };
            const response = await admin.messaging().sendEachForMulticast(message);
            this.logger.log(`Push notifications sent: ${response.successCount} successful, ${response.failureCount} failed`);
            return {
                successCount: response.successCount,
                failureCount: response.failureCount,
            };
        }
        catch (error) {
            this.logger.error('Failed to send multicast push notifications:', error);
            return { successCount: 0, failureCount: fcmTokens.length };
        }
    }
    convertDataToStrings(data) {
        const result = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = typeof value === 'string' ? value : JSON.stringify(value);
        }
        return result;
    }
};
exports.PushService = PushService;
exports.PushService = PushService = PushService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PushService);
//# sourceMappingURL=push.service.js.map