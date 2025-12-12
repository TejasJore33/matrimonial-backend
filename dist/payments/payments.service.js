"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const plan_config_1 = require("./plan-config");
const Razorpay = require("razorpay");
let PaymentsService = class PaymentsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.razorpay = null;
        this.isRazorpayConfigured = false;
        const keyId = process.env.RAZORPAY_KEY_ID || '';
        const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
        if (keyId && keySecret && keyId !== 'your-key-id' && keySecret !== 'your-key-secret') {
            try {
                this.razorpay = new Razorpay({
                    key_id: keyId,
                    key_secret: keySecret,
                });
                this.isRazorpayConfigured = true;
            }
            catch (error) {
                console.warn('Failed to initialize Razorpay:', error);
                this.razorpay = null;
            }
        }
        else {
            console.warn('Razorpay credentials not configured. Payment features will be limited.');
        }
    }
    async createSubscription(userId, dto) {
        const { plan } = dto;
        if (!plan) {
            throw new common_1.BadRequestException('Plan is required');
        }
        const planKey = plan.toUpperCase();
        const planConfig = plan_config_1.PLAN_CONFIG[planKey];
        if (!planConfig) {
            throw new common_1.BadRequestException(`Invalid plan: ${plan}`);
        }
        const amount = planConfig.totalPrice;
        let orderId;
        let orderAmount;
        let orderCurrency;
        let isMockPayment = false;
        if (this.isRazorpayConfigured && this.razorpay) {
            try {
                const order = await this.razorpay.orders.create({
                    amount: amount,
                    currency: 'INR',
                    receipt: `sub_${userId}_${Date.now()}`,
                    notes: {
                        userId,
                        type: 'SUBSCRIPTION',
                        plan: planKey,
                        duration: planConfig.duration.toString(),
                        company: 'RKTECH SOLUTIONS',
                        product: 'Matrimonial',
                    },
                });
                orderId = order.id;
                orderAmount = Number(order.amount);
                orderCurrency = order.currency;
            }
            catch (error) {
                console.error('Razorpay order creation failed:', error);
                throw new common_1.BadRequestException(error.message || 'Failed to create payment order. Please check Razorpay configuration.');
            }
        }
        else {
            orderId = `order_mock_${Date.now()}`;
            orderAmount = amount;
            orderCurrency = 'INR';
            isMockPayment = true;
            console.log('💰 [DUMMY TRANSACTION] Creating mock subscription payment:', { userId, plan, amount });
        }
        const payment = await this.prisma.payment.create({
            data: {
                userId,
                razorpayOrderId: orderId,
                amount,
                currency: 'INR',
                status: isMockPayment ? 'COMPLETED' : 'PENDING',
                type: 'SUBSCRIPTION',
                metadata: { plan: planKey, duration: planConfig.duration },
                razorpayPaymentId: isMockPayment ? `pay_mock_${Date.now()}` : null,
            },
        });
        if (isMockPayment) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + planConfig.duration);
            await this.prisma.subscription.create({
                data: {
                    userId: payment.userId,
                    plan: planKey,
                    status: 'ACTIVE',
                    startDate,
                    endDate,
                    razorpayPlanId: payment.razorpayPaymentId || `plan_mock_${Date.now()}`,
                    contactViewsLimit: planConfig.features.contactViewsLimit,
                    contactViewsUsed: 0,
                    profileBoostCredits: planConfig.features.profileBoostCredits,
                    verifiedBadgeIncluded: planConfig.features.verifiedBadgeIncluded,
                    horoscopeReportsIncluded: planConfig.features.horoscopeReportsIncluded,
                },
            });
            if (planConfig.features.verifiedBadgeIncluded) {
                await this.prisma.profile.updateMany({
                    where: { userId },
                    data: { isVerified: true, verifiedAt: new Date() },
                });
            }
            if (planConfig.features.profileHighlighting) {
                await this.prisma.profile.updateMany({
                    where: { userId },
                    data: { isHighlighted: true },
                });
            }
            console.log('✅ [DUMMY TRANSACTION] Subscription created successfully:', {
                userId,
                plan: planKey,
                endDate,
                features: planConfig.features,
            });
        }
        return {
            orderId,
            amount: orderAmount,
            currency: orderCurrency,
            paymentId: payment.id,
            isMockPayment,
        };
    }
    async verifyPayment(paymentId, razorpayPaymentId, razorpaySignature) {
        const isMockPayment = razorpayPaymentId.startsWith('pay_mock_') || razorpaySignature === 'mock_signature';
        if (!isMockPayment) {
            const crypto = require('crypto');
            const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
            if (!keySecret || keySecret === 'your-key-secret') {
                throw new common_1.BadRequestException('Razorpay not configured');
            }
            const hmac = crypto.createHmac('sha256', keySecret);
            hmac.update(paymentId + '|' + razorpayPaymentId);
            const generatedSignature = hmac.digest('hex');
            if (generatedSignature !== razorpaySignature) {
                throw new common_1.BadRequestException('Invalid payment signature');
            }
        }
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'COMPLETED',
                razorpayPaymentId,
            },
        });
        if (payment.type === 'SUBSCRIPTION') {
            const metadata = payment.metadata;
            const planKey = metadata.plan;
            const planConfig = plan_config_1.PLAN_CONFIG[planKey];
            if (!planConfig) {
                throw new common_1.BadRequestException(`Invalid plan configuration for: ${planKey}`);
            }
            const startDate = new Date();
            const endDate = new Date();
            const duration = metadata.duration || planConfig.duration;
            endDate.setMonth(endDate.getMonth() + duration);
            await this.prisma.subscription.create({
                data: {
                    userId: payment.userId,
                    plan: planKey,
                    status: 'ACTIVE',
                    startDate,
                    endDate,
                    razorpayPlanId: razorpayPaymentId,
                    contactViewsLimit: planConfig.features.contactViewsLimit,
                    contactViewsUsed: 0,
                    profileBoostCredits: planConfig.features.profileBoostCredits,
                    verifiedBadgeIncluded: planConfig.features.verifiedBadgeIncluded,
                    horoscopeReportsIncluded: planConfig.features.horoscopeReportsIncluded,
                },
            });
            if (planConfig.features.verifiedBadgeIncluded) {
                await this.prisma.profile.updateMany({
                    where: { userId: payment.userId },
                    data: { isVerified: true, verifiedAt: new Date() },
                });
            }
            if (planConfig.features.profileHighlighting) {
                await this.prisma.profile.updateMany({
                    where: { userId: payment.userId },
                    data: { isHighlighted: true },
                });
            }
        }
        if (payment.type === 'ADDON') {
            const metadata = payment.metadata;
            const addOnType = metadata.addOnType;
            let expiresAt = null;
            if (addOnType === 'PROFILE_BOOST') {
                expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 24);
            }
            await this.prisma.addOn.create({
                data: {
                    userId: payment.userId,
                    type: addOnType,
                    paymentId: payment.id,
                    expiresAt,
                    isActive: true,
                },
            });
            if (addOnType === 'VERIFIED_BADGE') {
                await this.prisma.profile.updateMany({
                    where: { userId: payment.userId },
                    data: {
                        isVerified: true,
                        verifiedAt: new Date(),
                    },
                });
            }
        }
        if (payment.type === 'SERVICE') {
            const metadata = payment.metadata;
            const serviceType = metadata.serviceType;
            const services = await this.prisma.service.findMany({
                where: {
                    paymentId: payment.id,
                    status: 'PENDING',
                },
            });
            for (const service of services) {
                await this.prisma.service.update({
                    where: { id: service.id },
                    data: { status: 'CONFIRMED' },
                });
                await this.activateServiceAfterPayment(service.id, serviceType, payment.userId);
            }
        }
        return { message: 'Payment verified successfully' };
    }
    async createAddOn(userId, dto) {
        const { type } = dto;
        const addOnPrices = {
            PROFILE_BOOST: 9900,
            VERIFIED_BADGE: 19900,
            HOROSCOPE_REPORT: 14900,
        };
        const amount = addOnPrices[type];
        if (!amount) {
            throw new common_1.BadRequestException('Invalid add-on type');
        }
        let orderId;
        let orderAmount;
        let orderCurrency;
        let isMockPayment = false;
        if (this.isRazorpayConfigured && this.razorpay) {
            try {
                const order = await this.razorpay.orders.create({
                    amount: amount,
                    currency: 'INR',
                    receipt: `addon_${userId}_${Date.now()}`,
                    notes: {
                        userId,
                        type: 'ADDON',
                        addOnType: type,
                        company: 'RKTECH SOLUTIONS',
                        product: 'Matrimonial',
                    },
                });
                orderId = order.id;
                orderAmount = Number(order.amount);
                orderCurrency = order.currency;
            }
            catch (error) {
                console.error('Razorpay order creation failed:', error);
                throw new common_1.BadRequestException(error.message || 'Failed to create payment order. Please check Razorpay configuration.');
            }
        }
        else {
            orderId = `order_mock_${Date.now()}`;
            orderAmount = amount;
            orderCurrency = 'INR';
            isMockPayment = true;
            console.log('💰 [DUMMY TRANSACTION] Creating mock add-on payment:', { userId, type, amount });
        }
        const payment = await this.prisma.payment.create({
            data: {
                userId,
                razorpayOrderId: orderId,
                amount,
                currency: 'INR',
                status: isMockPayment ? 'COMPLETED' : 'PENDING',
                type: 'ADDON',
                addOnType: type,
                metadata: { addOnType: type },
                razorpayPaymentId: isMockPayment ? `pay_mock_${Date.now()}` : null,
            },
        });
        if (isMockPayment) {
            let expiresAt = null;
            if (type === 'PROFILE_BOOST') {
                expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 24);
            }
            await this.prisma.addOn.create({
                data: {
                    userId: payment.userId,
                    type: type,
                    paymentId: payment.id,
                    expiresAt,
                    isActive: true,
                },
            });
            if (type === 'VERIFIED_BADGE') {
                await this.prisma.profile.updateMany({
                    where: { userId: payment.userId },
                    data: {
                        isVerified: true,
                        verifiedAt: new Date(),
                    },
                });
            }
            console.log('✅ [DUMMY TRANSACTION] Add-on created successfully:', { userId, type });
        }
        return {
            orderId,
            amount: orderAmount,
            currency: orderCurrency,
            paymentId: payment.id,
            isMockPayment,
        };
    }
    async createServicePayment(userId, serviceType, amount, metadata) {
        let orderId;
        let orderAmount;
        let orderCurrency;
        let isMockPayment = false;
        if (this.isRazorpayConfigured && this.razorpay) {
            try {
                const order = await this.razorpay.orders.create({
                    amount: amount,
                    currency: 'INR',
                    receipt: `service_${userId}_${Date.now()}`,
                    notes: {
                        userId,
                        type: 'SERVICE',
                        serviceType,
                        company: 'RKTECH SOLUTIONS',
                        product: 'Matrimonial',
                        ...metadata,
                    },
                });
                orderId = order.id;
                orderAmount = Number(order.amount);
                orderCurrency = order.currency;
            }
            catch (error) {
                console.error('Razorpay order creation failed:', error);
                throw new common_1.BadRequestException(error.message || 'Failed to create payment order. Please check Razorpay configuration.');
            }
        }
        else {
            orderId = `order_mock_service_${Date.now()}`;
            orderAmount = amount;
            orderCurrency = 'INR';
            isMockPayment = true;
            console.log('💰 [DUMMY TRANSACTION] Creating mock service payment:', { userId, serviceType, amount });
        }
        const payment = await this.prisma.payment.create({
            data: {
                userId,
                razorpayOrderId: orderId,
                amount,
                currency: 'INR',
                status: isMockPayment ? 'COMPLETED' : 'PENDING',
                type: 'SERVICE',
                metadata: { serviceType, ...metadata },
                razorpayPaymentId: isMockPayment ? `pay_mock_service_${Date.now()}` : null,
            },
        });
        if (isMockPayment) {
            console.log('✅ [DUMMY TRANSACTION] Service payment created successfully:', { userId, serviceType, amount });
        }
        return {
            orderId,
            amount: orderAmount,
            currency: orderCurrency,
            paymentId: payment.id,
            isMockPayment,
        };
    }
    async getSubscriptions(userId) {
        return this.prisma.subscription.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getActiveSubscription(userId) {
        return this.prisma.subscription.findFirst({
            where: {
                userId,
                status: 'ACTIVE',
                endDate: { gt: new Date() },
            },
        });
    }
    async getAddOns(userId) {
        return this.prisma.addOn.findMany({
            where: {
                userId,
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
        });
    }
    async getPaymentHistory(userId) {
        return this.prisma.payment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getAvailablePlans() {
        const planKeys = ['GOLD_3M', 'GOLD_PLUS_3M', 'DIAMOND_6M', 'DIAMOND_PLUS_6M', 'PLATINUM_PLUS_12M'];
        return planKeys.map((key) => {
            const config = plan_config_1.PLAN_CONFIG[key];
            return {
                id: key,
                name: config.name,
                duration: config.duration,
                monthlyPrice: config.monthlyPrice,
                totalPrice: config.totalPrice,
                originalPrice: config.originalPrice,
                discount: config.discount,
                badge: config.badge,
                features: config.features,
                perMonth: Math.round(config.totalPrice / config.duration / 100),
                total: Math.round(config.totalPrice / 100),
                original: Math.round(config.originalPrice / 100),
            };
        });
    }
    async applyCoupon(couponCode, amount) {
        const coupons = {
            'WELCOME10': { discount: 10, type: 'PERCENTAGE', minAmount: 10000 },
            'SAVE50': { discount: 50, type: 'FIXED', minAmount: 5000 },
            'FIRST100': { discount: 100, type: 'FIXED', minAmount: 10000 },
        };
        const coupon = coupons[couponCode.toUpperCase()];
        if (!coupon) {
            throw new common_1.BadRequestException('Invalid coupon code');
        }
        if (coupon.minAmount && amount < coupon.minAmount) {
            throw new common_1.BadRequestException(`Minimum amount of ₹${coupon.minAmount / 100} required for this coupon`);
        }
        let discount = 0;
        if (coupon.type === 'PERCENTAGE') {
            discount = Math.round((amount * coupon.discount) / 100);
        }
        else {
            discount = coupon.discount;
        }
        const finalAmount = Math.max(0, amount - discount);
        return {
            couponCode,
            originalAmount: amount,
            discount,
            finalAmount,
            discountType: coupon.type,
        };
    }
    async createGiftSubscription(giverId, recipientEmail, plan, message) {
        const recipient = await this.prisma.user.findUnique({
            where: { email: recipientEmail },
        });
        if (!recipient) {
            throw new common_1.NotFoundException('Recipient not found');
        }
        const planPrices = {
            PREMIUM: 39900,
            PARENT: 79900,
        };
        const amount = planPrices[plan];
        if (!amount) {
            throw new common_1.BadRequestException('Invalid plan');
        }
        let orderId;
        let orderAmount;
        let orderCurrency;
        if (this.isRazorpayConfigured && this.razorpay) {
            try {
                const order = await this.razorpay.orders.create({
                    amount: amount,
                    currency: 'INR',
                    receipt: `gift_${giverId}_${Date.now()}`,
                    notes: {
                        giverId,
                        recipientId: recipient.id,
                        type: 'GIFT_SUBSCRIPTION',
                        plan,
                        message,
                        company: 'RKTECH SOLUTIONS',
                        product: 'Matrimonial',
                    },
                });
                orderId = order.id;
                orderAmount = Number(order.amount);
                orderCurrency = order.currency;
            }
            catch (error) {
                console.error('Razorpay order creation failed:', error);
                throw new common_1.BadRequestException(error.message || 'Failed to create payment order. Please check Razorpay configuration.');
            }
        }
        else {
            orderId = `order_mock_${Date.now()}`;
            orderAmount = amount;
            orderCurrency = 'INR';
            console.warn('Razorpay not configured. Using mock order for development.');
        }
        const payment = await this.prisma.payment.create({
            data: {
                userId: giverId,
                razorpayOrderId: orderId,
                amount,
                currency: 'INR',
                status: 'PENDING',
                type: 'GIFT_SUBSCRIPTION',
                metadata: {
                    recipientId: recipient.id,
                    recipientEmail,
                    plan,
                    message,
                },
            },
        });
        return {
            orderId,
            amount: orderAmount,
            currency: orderCurrency,
            paymentId: payment.id,
            recipient: {
                id: recipient.id,
                email: recipient.email,
            },
        };
    }
    async activateServiceAfterPayment(serviceId, serviceType, userId) {
        switch (serviceType) {
            case 'PHOTO_VERIFICATION':
            case 'ID_VERIFICATION':
                await this.prisma.profile.updateMany({
                    where: { userId },
                    data: { isVerified: true, verifiedAt: new Date() },
                });
                break;
            case 'PROFILE_HIGHLIGHTING':
            case 'FEATURED_PROFILE':
                await this.prisma.profile.updateMany({
                    where: { userId },
                    data: { isHighlighted: true },
                });
                break;
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map