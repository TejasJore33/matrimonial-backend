// Plan configuration with pricing, duration, and features
export interface PlanFeatures {
  name: string;
  duration: number; // in months
  monthlyPrice: number; // in paise
  totalPrice: number; // in paise
  originalPrice: number; // in paise (before discount)
  discount: number; // percentage
  badge?: 'TOP_SELLER' | 'BEST_VALUE';
  features: {
    unlimitedMessages: boolean;
    contactViewsLimit: number | null; // null = unlimited, number = limit
    contactViewsUnlimitedForMatches: boolean; // Unlimited for accepted matches
    profileBoostCredits: number;
    verifiedBadgeIncluded: boolean;
    horoscopeReportsIncluded: number;
    profileHighlighting: boolean;
    directContact: boolean; // Let matches contact you directly
    prioritySupport: boolean;
  };
}

export const PLAN_CONFIG: Record<string, PlanFeatures> = {
  GOLD_3M: {
    name: 'Gold 3 Months',
    duration: 3,
    monthlyPrice: 113500, // ₹1,135 per month
    totalPrice: 340500, // ₹3,405 total
    originalPrice: 454000, // ₹4,540 (25% off)
    discount: 25,
    features: {
      unlimitedMessages: true,
      contactViewsLimit: 50,
      contactViewsUnlimitedForMatches: false,
      profileBoostCredits: 2, // 2 profile boosts worth ₹198
      verifiedBadgeIncluded: false,
      horoscopeReportsIncluded: 0,
      profileHighlighting: true,
      directContact: true,
      prioritySupport: false,
    },
  },
  GOLD_PLUS_3M: {
    name: 'Gold Plus 3 Months',
    duration: 3,
    monthlyPrice: 120500, // ₹1,205 per month
    totalPrice: 361500, // ₹3,615 total
    originalPrice: 556000, // ₹5,560 (35% off)
    discount: 35,
    features: {
      unlimitedMessages: true,
      contactViewsLimit: 75,
      contactViewsUnlimitedForMatches: false,
      profileBoostCredits: 3, // 3 profile boosts worth ₹297
      verifiedBadgeIncluded: false,
      horoscopeReportsIncluded: 1, // 1 horoscope report worth ₹149
      profileHighlighting: true,
      directContact: true,
      prioritySupport: false,
    },
  },
  DIAMOND_6M: {
    name: 'Diamond 6 Months',
    duration: 6,
    monthlyPrice: 70700, // ₹707 per month
    totalPrice: 424200, // ₹4,242 total
    originalPrice: 652000, // ₹6,520 (35% off)
    discount: 35,
    features: {
      unlimitedMessages: true,
      contactViewsLimit: 100,
      contactViewsUnlimitedForMatches: false,
      profileBoostCredits: 4, // 4 profile boosts worth ₹396
      verifiedBadgeIncluded: false,
      horoscopeReportsIncluded: 2, // 2 horoscope reports worth ₹298
      profileHighlighting: true,
      directContact: true,
      prioritySupport: true,
    },
  },
  DIAMOND_PLUS_6M: {
    name: 'Diamond Plus 6 Months',
    duration: 6,
    monthlyPrice: 75200, // ₹752 per month
    totalPrice: 451200, // ₹4,512 total
    originalPrice: 819900, // ₹8,199 (45% off)
    discount: 45,
    badge: 'TOP_SELLER',
    features: {
      unlimitedMessages: true,
      contactViewsLimit: 100,
      contactViewsUnlimitedForMatches: true, // Unlimited for accepted matches
      profileBoostCredits: 5, // 5 profile boosts worth ₹495
      verifiedBadgeIncluded: true, // Verified badge worth ₹199
      horoscopeReportsIncluded: 3, // 3 horoscope reports worth ₹447
      profileHighlighting: true,
      directContact: true,
      prioritySupport: true,
    },
  },
  PLATINUM_PLUS_12M: {
    name: 'Platinum Plus 12 Months',
    duration: 12,
    monthlyPrice: 49900, // ₹499 per month
    totalPrice: 598800, // ₹5,988 total
    originalPrice: 1330400, // ₹13,304 (55% off)
    discount: 55,
    badge: 'BEST_VALUE',
    features: {
      unlimitedMessages: true,
      contactViewsLimit: 200,
      contactViewsUnlimitedForMatches: true, // Unlimited for accepted matches
      profileBoostCredits: 10, // 10 profile boosts worth ₹990
      verifiedBadgeIncluded: true, // Verified badge worth ₹199
      horoscopeReportsIncluded: 5, // 5 horoscope reports worth ₹745
      profileHighlighting: true,
      directContact: true,
      prioritySupport: true,
    },
  },
  // Legacy plans (for backward compatibility)
  PREMIUM: {
    name: 'Premium',
    duration: 1,
    monthlyPrice: 39900, // ₹399 per month
    totalPrice: 39900,
    originalPrice: 39900,
    discount: 0,
    features: {
      unlimitedMessages: true,
      contactViewsLimit: 30,
      contactViewsUnlimitedForMatches: false,
      profileBoostCredits: 0,
      verifiedBadgeIncluded: false,
      horoscopeReportsIncluded: 0,
      profileHighlighting: true,
      directContact: true,
      prioritySupport: false,
    },
  },
  PARENT: {
    name: 'Parent',
    duration: 1,
    monthlyPrice: 79900, // ₹799 per month
    totalPrice: 79900,
    originalPrice: 79900,
    discount: 0,
    features: {
      unlimitedMessages: true,
      contactViewsLimit: 50,
      contactViewsUnlimitedForMatches: false,
      profileBoostCredits: 1,
      verifiedBadgeIncluded: false,
      horoscopeReportsIncluded: 0,
      profileHighlighting: true,
      directContact: true,
      prioritySupport: true,
    },
  },
};

