export interface PlanFeatures {
    name: string;
    duration: number;
    monthlyPrice: number;
    totalPrice: number;
    originalPrice: number;
    discount: number;
    badge?: 'TOP_SELLER' | 'BEST_VALUE';
    features: {
        unlimitedMessages: boolean;
        contactViewsLimit: number | null;
        contactViewsUnlimitedForMatches: boolean;
        profileBoostCredits: number;
        verifiedBadgeIncluded: boolean;
        horoscopeReportsIncluded: number;
        profileHighlighting: boolean;
        directContact: boolean;
        prioritySupport: boolean;
    };
}
export declare const PLAN_CONFIG: Record<string, PlanFeatures>;
