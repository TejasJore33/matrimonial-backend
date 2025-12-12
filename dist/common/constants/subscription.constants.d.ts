export declare const PAID_SUBSCRIPTION_PLANS: readonly ["PREMIUM", "PARENT", "GOLD_3M", "GOLD_PLUS_3M", "DIAMOND_6M", "DIAMOND_PLUS_6M", "PLATINUM_PLUS_12M"];
export declare function isPaidPlan(plan: string): boolean;
export declare function hasActivePaidSubscription(prisma: any, userId: string): Promise<boolean>;
export declare function getActiveSubscription(prisma: any, userId: string): Promise<any>;
