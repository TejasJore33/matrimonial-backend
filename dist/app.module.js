"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const profiles_module_1 = require("./profiles/profiles.module");
const search_module_1 = require("./search/search.module");
const interests_module_1 = require("./interests/interests.module");
const chat_module_1 = require("./chat/chat.module");
const payments_module_1 = require("./payments/payments.module");
const admin_module_1 = require("./admin/admin.module");
const notifications_module_1 = require("./notifications/notifications.module");
const upload_module_1 = require("./upload/upload.module");
const shortlist_module_1 = require("./shortlist/shortlist.module");
const block_module_1 = require("./block/block.module");
const success_stories_module_1 = require("./success-stories/success-stories.module");
const referral_module_1 = require("./referral/referral.module");
const horoscope_module_1 = require("./horoscope/horoscope.module");
const family_module_1 = require("./family/family.module");
const verification_module_1 = require("./verification/verification.module");
const comparison_module_1 = require("./comparison/comparison.module");
const social_module_1 = require("./social/social.module");
const documents_module_1 = require("./documents/documents.module");
const gamification_module_1 = require("./gamification/gamification.module");
const analytics_module_1 = require("./analytics/analytics.module");
const video_call_module_1 = require("./video-call/video-call.module");
const ai_module_1 = require("./ai/ai.module");
const community_module_1 = require("./community/community.module");
const localization_module_1 = require("./localization/localization.module");
const matching_module_1 = require("./matching/matching.module");
const features_module_1 = require("./features/features.module");
const chat_enhancements_module_1 = require("./chat-enhancements/chat-enhancements.module");
const safety_module_1 = require("./safety/safety.module");
const support_module_1 = require("./support/support.module");
const services_module_1 = require("./services/services.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            profiles_module_1.ProfilesModule,
            search_module_1.SearchModule,
            interests_module_1.InterestsModule,
            chat_module_1.ChatModule,
            payments_module_1.PaymentsModule,
            admin_module_1.AdminModule,
            notifications_module_1.NotificationsModule,
            upload_module_1.UploadModule,
            shortlist_module_1.ShortlistModule,
            block_module_1.BlockModule,
            success_stories_module_1.SuccessStoriesModule,
            referral_module_1.ReferralModule,
            horoscope_module_1.HoroscopeModule,
            family_module_1.FamilyModule,
            verification_module_1.VerificationModule,
            comparison_module_1.ComparisonModule,
            social_module_1.SocialModule,
            documents_module_1.DocumentsModule,
            gamification_module_1.GamificationModule,
            analytics_module_1.AnalyticsModule,
            video_call_module_1.VideoCallModule,
            ai_module_1.AiModule,
            community_module_1.CommunityModule,
            localization_module_1.LocalizationModule,
            matching_module_1.MatchingModule,
            features_module_1.FeaturesModule,
            chat_enhancements_module_1.ChatEnhancementsModule,
            safety_module_1.SafetyModule,
            support_module_1.SupportModule,
            services_module_1.ServicesModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map