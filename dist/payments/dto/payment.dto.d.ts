export declare class CreateSubscriptionDto {
    plan: 'PREMIUM' | 'PARENT' | 'GOLD_3M' | 'GOLD_PLUS_3M' | 'DIAMOND_6M' | 'DIAMOND_PLUS_6M' | 'PLATINUM_PLUS_12M';
}
export declare class CreateAddOnDto {
    type: 'PROFILE_BOOST' | 'VERIFIED_BADGE' | 'HOROSCOPE_REPORT';
}
export declare class VerifyPaymentDto {
    paymentId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}
