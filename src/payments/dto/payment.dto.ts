import { IsEnum, IsString, IsNotEmpty } from 'class-validator';

export class CreateSubscriptionDto {
  @IsNotEmpty({ message: 'Plan is required' })
  @IsEnum(['PREMIUM', 'PARENT', 'GOLD_3M', 'GOLD_PLUS_3M', 'DIAMOND_6M', 'DIAMOND_PLUS_6M', 'PLATINUM_PLUS_12M'], {
    message: 'Invalid plan selected',
  })
  plan:
    | 'PREMIUM'
    | 'PARENT'
    | 'GOLD_3M'
    | 'GOLD_PLUS_3M'
    | 'DIAMOND_6M'
    | 'DIAMOND_PLUS_6M'
    | 'PLATINUM_PLUS_12M';
}

export class CreateAddOnDto {
  @IsEnum(['PROFILE_BOOST', 'VERIFIED_BADGE', 'HOROSCOPE_REPORT'])
  type: 'PROFILE_BOOST' | 'VERIFIED_BADGE' | 'HOROSCOPE_REPORT';
}

export class VerifyPaymentDto {
  @IsString()
  paymentId: string;

  @IsString()
  razorpayPaymentId: string;

  @IsString()
  razorpaySignature: string;
}

