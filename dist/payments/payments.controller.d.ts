import { PaymentsService } from './payments.service';
import { CreateSubscriptionDto, CreateAddOnDto, VerifyPaymentDto } from './dto/payment.dto';
export declare class PaymentsController {
    private paymentsService;
    constructor(paymentsService: PaymentsService);
    createSubscription(user: any, dto: CreateSubscriptionDto): Promise<{
        orderId: string;
        amount: number;
        currency: string;
        paymentId: string;
        isMockPayment: boolean;
    }>;
    createAddOn(user: any, dto: CreateAddOnDto): Promise<{
        orderId: string;
        amount: number;
        currency: string;
        paymentId: string;
        isMockPayment: boolean;
    }>;
    verifyPayment(user: any, dto: VerifyPaymentDto): Promise<{
        message: string;
    }>;
    getSubscriptions(user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        userId: string;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        razorpaySubscriptionId: string | null;
        razorpayPlanId: string | null;
        startDate: Date;
        endDate: Date;
        contactViewsUsed: number;
        contactViewsLimit: number | null;
        profileBoostCredits: number;
        verifiedBadgeIncluded: boolean;
        horoscopeReportsIncluded: number;
    }[]>;
    getActiveSubscription(user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        userId: string;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        razorpaySubscriptionId: string | null;
        razorpayPlanId: string | null;
        startDate: Date;
        endDate: Date;
        contactViewsUsed: number;
        contactViewsLimit: number | null;
        profileBoostCredits: number;
        verifiedBadgeIncluded: boolean;
        horoscopeReportsIncluded: number;
    }>;
    getAddOns(user: any): Promise<{
        type: import(".prisma/client").$Enums.AddOnType;
        id: string;
        createdAt: Date;
        userId: string;
        expiresAt: Date | null;
        paymentId: string | null;
        isActive: boolean;
    }[]>;
    getPaymentHistory(user: any): Promise<{
        type: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PaymentStatus;
        userId: string;
        razorpayOrderId: string | null;
        razorpayPaymentId: string | null;
        amount: number;
        currency: string;
        addOnType: import(".prisma/client").$Enums.AddOnType | null;
        subscriptionId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    getAvailablePlans(): Promise<{
        id: string;
        name: string;
        duration: number;
        monthlyPrice: number;
        totalPrice: number;
        originalPrice: number;
        discount: number;
        badge: "TOP_SELLER" | "BEST_VALUE";
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
        perMonth: number;
        total: number;
        original: number;
    }[]>;
    applyCoupon(body: {
        couponCode: string;
        amount: number;
    }): Promise<{
        couponCode: string;
        originalAmount: number;
        discount: number;
        finalAmount: number;
        discountType: "PERCENTAGE" | "FIXED";
    }>;
    createGiftSubscription(user: any, body: {
        recipientEmail: string;
        plan: string;
        message?: string;
    }): Promise<{
        orderId: string;
        amount: number;
        currency: string;
        paymentId: string;
        recipient: {
            id: string;
            email: string;
        };
    }>;
}
