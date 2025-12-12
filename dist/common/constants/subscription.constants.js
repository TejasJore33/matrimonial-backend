"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAID_SUBSCRIPTION_PLANS = void 0;
exports.isPaidPlan = isPaidPlan;
exports.hasActivePaidSubscription = hasActivePaidSubscription;
exports.getActiveSubscription = getActiveSubscription;
exports.PAID_SUBSCRIPTION_PLANS = [
    'PREMIUM',
    'PARENT',
    'GOLD_3M',
    'GOLD_PLUS_3M',
    'DIAMOND_6M',
    'DIAMOND_PLUS_6M',
    'PLATINUM_PLUS_12M',
];
function isPaidPlan(plan) {
    return exports.PAID_SUBSCRIPTION_PLANS.includes(plan);
}
async function hasActivePaidSubscription(prisma, userId) {
    const subscription = await prisma.subscription.findFirst({
        where: {
            userId,
            status: 'ACTIVE',
            endDate: { gt: new Date() },
            plan: { in: exports.PAID_SUBSCRIPTION_PLANS },
        },
    });
    return !!subscription;
}
async function getActiveSubscription(prisma, userId) {
    return prisma.subscription.findFirst({
        where: {
            userId,
            status: 'ACTIVE',
            endDate: { gt: new Date() },
            plan: { in: exports.PAID_SUBSCRIPTION_PLANS },
        },
        orderBy: { createdAt: 'desc' },
    });
}
//# sourceMappingURL=subscription.constants.js.map