import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { SearchModule } from './search/search.module';
import { InterestsModule } from './interests/interests.module';
import { ChatModule } from './chat/chat.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadModule } from './upload/upload.module';
import { ShortlistModule } from './shortlist/shortlist.module';
import { BlockModule } from './block/block.module';
import { SuccessStoriesModule } from './success-stories/success-stories.module';
import { ReferralModule } from './referral/referral.module';
import { HoroscopeModule } from './horoscope/horoscope.module';
import { FamilyModule } from './family/family.module';
import { VerificationModule } from './verification/verification.module';
import { ComparisonModule } from './comparison/comparison.module';
import { SocialModule } from './social/social.module';
import { DocumentsModule } from './documents/documents.module';
import { GamificationModule } from './gamification/gamification.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { VideoCallModule } from './video-call/video-call.module';
import { AiModule } from './ai/ai.module';
import { CommunityModule } from './community/community.module';
import { LocalizationModule } from './localization/localization.module';
import { MatchingModule } from './matching/matching.module';
import { FeaturesModule } from './features/features.module';
import { ChatEnhancementsModule } from './chat-enhancements/chat-enhancements.module';
import { SafetyModule } from './safety/safety.module';
import { SupportModule } from './support/support.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    SearchModule,
    InterestsModule,
    ChatModule,
    PaymentsModule,
    AdminModule,
    NotificationsModule,
    UploadModule,
    ShortlistModule,
    BlockModule,
    SuccessStoriesModule,
    ReferralModule,
    HoroscopeModule,
    FamilyModule,
    VerificationModule,
    ComparisonModule,
    SocialModule,
    DocumentsModule,
    GamificationModule,
    AnalyticsModule,
    VideoCallModule,
    AiModule,
    CommunityModule,
    LocalizationModule,
    MatchingModule,
    FeaturesModule,
    ChatEnhancementsModule,
    SafetyModule,
    SupportModule,
    ServicesModule,
  ],
})
export class AppModule {}
