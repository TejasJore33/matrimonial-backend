import { IsEnum, IsString, IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';

export class BookServiceDto {
  @IsEnum([
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
  ])
  serviceType: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: any;
}

export class UpdateServiceStatusDto {
  @IsEnum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED'])
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RateServiceDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  review?: string;
}

export class ScheduleBookingDto {
  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsInt()
  duration?: number; // in minutes

  @IsOptional()
  @IsString()
  notes?: string;
}

