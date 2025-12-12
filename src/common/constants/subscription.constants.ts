/**
 * Subscription plan constants
 */

// All paid subscription plans (excluding FREE)
export const PAID_SUBSCRIPTION_PLANS = [
  'PREMIUM',
  'PARENT',
  'GOLD_3M',
  'GOLD_PLUS_3M',
  'DIAMOND_6M',
  'DIAMOND_PLUS_6M',
  'PLATINUM_PLUS_12M',
  
] as const;

/**
 * Check if a plan is a paid plan (not FREE)
 */
export function isPaidPlan(plan: string): boolean {
  return PAID_SUBSCRIPTION_PLANS.includes(plan as any);
}

/**
 * Check if user has any active paid subscription
 */
export async function hasActivePaidSubscription(
  prisma: any,
  userId: string,
): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gt: new Date() },
      plan: { in: PAID_SUBSCRIPTION_PLANS },
    },
  });
  return !!subscription;
}

/**
 * Get active subscription for a user
 */
export async function getActiveSubscription(prisma: any, userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gt: new Date() },
      plan: { in: PAID_SUBSCRIPTION_PLANS },
    },
    orderBy: { createdAt: 'desc' },
  });
}

