import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto, CreateAddOnDto } from './dto/payment.dto';
export declare class PaymentsService {
    private prisma;
    private razorpay;
    private isRazorpayConfigured;
    constructor(prisma: PrismaService);
    createSubscription(userId: string, dto: CreateSubscriptionDto): Promise<{
        orderId: string;
        amount: number;
        currency: string;
        paymentId: string;
        isMockPayment: boolean;
    }>;
    verifyPayment(paymentId: string, razorpayPaymentId: string, razorpaySignature: string): Promise<{
        message: string;
    }>;
    createAddOn(userId: string, dto: CreateAddOnDto): Promise<{
        orderId: string;
        amount: number;
        currency: string;
        paymentId: string;
        isMockPayment: boolean;
    }>;
    createServicePayment(userId: string, serviceType: string, amount: number, metadata?: any): Promise<{
        orderId: string;
        amount: number;
        currency: string;
        paymentId: string;
        isMockPayment: boolean;
    }>;
    getSubscriptions(userId: string): Promise<{
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
    getActiveSubscription(userId: string): Promise<{
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
    getAddOns(userId: string): Promise<{
        type: import(".prisma/client").$Enums.AddOnType;
        id: string;
        createdAt: Date;
        userId: string;
        expiresAt: Date | null;
        paymentId: string | null;
        isActive: boolean;
    }[]>;
    getPaymentHistory(userId: string): Promise<{
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
    applyCoupon(couponCode: string, amount: number): Promise<{
        couponCode: string;
        originalAmount: number;
        discount: number;
        finalAmount: number;
        discountType: "PERCENTAGE" | "FIXED";
    }>;
    createGiftSubscription(giverId: string, recipientEmail: string, plan: string, message?: string): Promise<{
        orderId: string;
        amount: number;
        currency: string;
        paymentId: string;
        recipient: {
            id: string;
            email: string;
        };
    }>;
    private activateServiceAfterPayment;
}
