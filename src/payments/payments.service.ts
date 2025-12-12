import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto, CreateAddOnDto } from './dto/payment.dto';
import { PLAN_CONFIG } from './plan-config';
import Razorpay = require('razorpay');

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay | null = null;
  private isRazorpayConfigured: boolean = false;

  constructor(private prisma: PrismaService) {
    const keyId = process.env.RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    
    if (keyId && keySecret && keyId !== 'your-key-id' && keySecret !== 'your-key-secret') {
      try {
        this.razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });
        this.isRazorpayConfigured = true;
      } catch (error) {
        console.warn('Failed to initialize Razorpay:', error);
        this.razorpay = null;
      }
    } else {
      console.warn('Razorpay credentials not configured. Payment features will be limited.');
    }
  }

  async createSubscription(userId: string, dto: CreateSubscriptionDto) {
    const { plan } = dto;

    if (!plan) {
      throw new BadRequestException('Plan is required');
    }

    const planKey = plan.toUpperCase();
    const planConfig = PLAN_CONFIG[planKey];

    if (!planConfig) {
      throw new BadRequestException(`Invalid plan: ${plan}`);
    }

    const amount = planConfig.totalPrice; // Total price for the subscription period

    let orderId: string;
    let orderAmount: number;
    let orderCurrency: string;
    let isMockPayment = false;

    if (this.isRazorpayConfigured && this.razorpay) {
      try {
        // Create Razorpay order
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
      } catch (error: any) {
        console.error('Razorpay order creation failed:', error);
        throw new BadRequestException(
          error.message || 'Failed to create payment order. Please check Razorpay configuration.',
        );
      }
    } else {
      // Development mode: Create mock order
      orderId = `order_mock_${Date.now()}`;
      orderAmount = amount;
      orderCurrency = 'INR';
      isMockPayment = true;
      console.log('💰 [DUMMY TRANSACTION] Creating mock subscription payment:', { userId, plan, amount });
    }

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        razorpayOrderId: orderId,
        amount,
        currency: 'INR',
        status: isMockPayment ? 'COMPLETED' : 'PENDING', // Auto-complete mock payments
        type: 'SUBSCRIPTION',
        metadata: { plan: planKey, duration: planConfig.duration },
        razorpayPaymentId: isMockPayment ? `pay_mock_${Date.now()}` : null,
      },
    });

    // Auto-create subscription for mock payments
    if (isMockPayment) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + planConfig.duration); // Set duration based on plan

      await this.prisma.subscription.create({
        data: {
          userId: payment.userId,
          plan: planKey as any,
          status: 'ACTIVE',
          startDate,
          endDate,
          razorpayPlanId: payment.razorpayPaymentId || `plan_mock_${Date.now()}`,
          // Set plan features
          contactViewsLimit: planConfig.features.contactViewsLimit,
          contactViewsUsed: 0,
          profileBoostCredits: planConfig.features.profileBoostCredits,
          verifiedBadgeIncluded: planConfig.features.verifiedBadgeIncluded,
          horoscopeReportsIncluded: planConfig.features.horoscopeReportsIncluded,
        },
      });

      // If verified badge is included, mark profile as verified
      if (planConfig.features.verifiedBadgeIncluded) {
        await this.prisma.profile.updateMany({
          where: { userId },
          data: { isVerified: true, verifiedAt: new Date() },
        });
      }

      // If profile highlighting is included, enable it
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
      isMockPayment, // Let frontend know this is a mock payment
    };
  }

  async verifyPayment(paymentId: string, razorpayPaymentId: string, razorpaySignature: string) {
    // Allow mock payments in development
    const isMockPayment = razorpayPaymentId.startsWith('pay_mock_') || razorpaySignature === 'mock_signature';
    
    if (!isMockPayment) {
      const crypto = require('crypto');
      const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
      if (!keySecret || keySecret === 'your-key-secret') {
        throw new BadRequestException('Razorpay not configured');
      }
      const hmac = crypto.createHmac('sha256', keySecret);
      hmac.update(paymentId + '|' + razorpayPaymentId);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== razorpaySignature) {
        throw new BadRequestException('Invalid payment signature');
      }
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment status
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        razorpayPaymentId,
      },
    });

    // Create subscription if type is SUBSCRIPTION
    if (payment.type === 'SUBSCRIPTION') {
      const metadata = payment.metadata as any;
      const planKey = metadata.plan;
      const planConfig = PLAN_CONFIG[planKey];

      if (!planConfig) {
        throw new BadRequestException(`Invalid plan configuration for: ${planKey}`);
      }

      const startDate = new Date();
      const endDate = new Date();
      const duration = metadata.duration || planConfig.duration;
      endDate.setMonth(endDate.getMonth() + duration);

      await this.prisma.subscription.create({
        data: {
          userId: payment.userId,
          plan: planKey as any,
          status: 'ACTIVE',
          startDate,
          endDate,
          razorpayPlanId: razorpayPaymentId,
          // Set plan features
          contactViewsLimit: planConfig.features.contactViewsLimit,
          contactViewsUsed: 0,
          profileBoostCredits: planConfig.features.profileBoostCredits,
          verifiedBadgeIncluded: planConfig.features.verifiedBadgeIncluded,
          horoscopeReportsIncluded: planConfig.features.horoscopeReportsIncluded,
        },
      });

      // If verified badge is included, mark profile as verified
      if (planConfig.features.verifiedBadgeIncluded) {
        await this.prisma.profile.updateMany({
          where: { userId: payment.userId },
          data: { isVerified: true, verifiedAt: new Date() },
        });
      }

      // If profile highlighting is included, enable it
      if (planConfig.features.profileHighlighting) {
        await this.prisma.profile.updateMany({
          where: { userId: payment.userId },
          data: { isHighlighted: true },
        });
      }
    }

    // Create add-on if type is ADDON
    if (payment.type === 'ADDON') {
      const metadata = payment.metadata as any;
      const addOnType = metadata.addOnType;

      let expiresAt: Date | null = null;
      if (addOnType === 'PROFILE_BOOST') {
        expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours
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

      // Handle verified badge
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

    // Handle service payment - service is already created, just update status
    if (payment.type === 'SERVICE') {
      const metadata = payment.metadata as any;
      const serviceType = metadata.serviceType;

      // Find the service by payment ID and update status
      const services = await (this.prisma as any).service.findMany({
        where: {
          paymentId: payment.id,
          status: 'PENDING',
        },
      });

      for (const service of services) {
        await (this.prisma as any).service.update({
          where: { id: service.id },
          data: { status: 'CONFIRMED' },
        });

        // Activate service based on type
        await this.activateServiceAfterPayment(service.id, serviceType, payment.userId);
      }
    }

    return { message: 'Payment verified successfully' };
  }

  async createAddOn(userId: string, dto: CreateAddOnDto) {
    const { type } = dto;

    const addOnPrices: Record<string, number> = {
      PROFILE_BOOST: 9900, // ₹99 in paise
      VERIFIED_BADGE: 19900, // ₹199 in paise
      HOROSCOPE_REPORT: 14900, // ₹149 in paise
    };

    const amount = addOnPrices[type];
    if (!amount) {
      throw new BadRequestException('Invalid add-on type');
    }

    let orderId: string;
    let orderAmount: number;
    let orderCurrency: string;
    let isMockPayment = false;

    if (this.isRazorpayConfigured && this.razorpay) {
      try {
        // Create Razorpay order
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
      } catch (error: any) {
        console.error('Razorpay order creation failed:', error);
        throw new BadRequestException(
          error.message || 'Failed to create payment order. Please check Razorpay configuration.',
        );
      }
    } else {
      // Development mode: Create mock order
      orderId = `order_mock_${Date.now()}`;
      orderAmount = amount;
      orderCurrency = 'INR';
      isMockPayment = true;
      console.log('💰 [DUMMY TRANSACTION] Creating mock add-on payment:', { userId, type, amount });
    }

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        razorpayOrderId: orderId,
        amount,
        currency: 'INR',
        status: isMockPayment ? 'COMPLETED' : 'PENDING', // Auto-complete mock payments
        type: 'ADDON',
        addOnType: type,
        metadata: { addOnType: type },
        razorpayPaymentId: isMockPayment ? `pay_mock_${Date.now()}` : null,
      },
    });

    // Auto-create add-on for mock payments
    if (isMockPayment) {
      let expiresAt: Date | null = null;
      if (type === 'PROFILE_BOOST') {
        expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours
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

      // Handle verified badge
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
      isMockPayment, // Let frontend know this is a mock payment
    };
  }

  async createServicePayment(userId: string, serviceType: string, amount: number, metadata?: any) {
    let orderId: string;
    let orderAmount: number;
    let orderCurrency: string;
    let isMockPayment = false;

    if (this.isRazorpayConfigured && this.razorpay) {
      try {
        // Create Razorpay order
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
      } catch (error: any) {
        console.error('Razorpay order creation failed:', error);
        throw new BadRequestException(
          error.message || 'Failed to create payment order. Please check Razorpay configuration.',
        );
      }
    } else {
      // Development mode: Create mock order
      orderId = `order_mock_service_${Date.now()}`;
      orderAmount = amount;
      orderCurrency = 'INR';
      isMockPayment = true;
      console.log('💰 [DUMMY TRANSACTION] Creating mock service payment:', { userId, serviceType, amount });
    }

    // Create payment record
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

    // Auto-complete service for mock payments
    if (isMockPayment) {
      // Service will be created by the services service
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

  async getSubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gt: new Date() },
      },
    });
  }

  async getAddOns(userId: string) {
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

  async getPaymentHistory(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAvailablePlans() {
    // Return all plans except FREE, PREMIUM, PARENT (legacy)
    const planKeys = ['GOLD_3M', 'GOLD_PLUS_3M', 'DIAMOND_6M', 'DIAMOND_PLUS_6M', 'PLATINUM_PLUS_12M'];
    
    return planKeys.map((key) => {
      const config = PLAN_CONFIG[key];
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
        perMonth: Math.round(config.totalPrice / config.duration / 100), // Convert to rupees
        total: Math.round(config.totalPrice / 100), // Convert to rupees
        original: Math.round(config.originalPrice / 100), // Convert to rupees
      };
    });
  }

  async applyCoupon(couponCode: string, amount: number) {
    // In production, store coupons in database
    // For now, hardcoded coupons
    const coupons: { [key: string]: { discount: number; type: 'PERCENTAGE' | 'FIXED'; minAmount?: number } } = {
      'WELCOME10': { discount: 10, type: 'PERCENTAGE', minAmount: 10000 },
      'SAVE50': { discount: 50, type: 'FIXED', minAmount: 5000 },
      'FIRST100': { discount: 100, type: 'FIXED', minAmount: 10000 },
    };

    const coupon = coupons[couponCode.toUpperCase()];
    if (!coupon) {
      throw new BadRequestException('Invalid coupon code');
    }

    if (coupon.minAmount && amount < coupon.minAmount) {
      throw new BadRequestException(`Minimum amount of ₹${coupon.minAmount / 100} required for this coupon`);
    }

    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = Math.round((amount * coupon.discount) / 100);
    } else {
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

  async createGiftSubscription(giverId: string, recipientEmail: string, plan: string, message?: string) {
    // Find recipient by email
    const recipient = await this.prisma.user.findUnique({
      where: { email: recipientEmail },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    const planPrices: Record<string, number> = {
      PREMIUM: 39900,
      PARENT: 79900,
    };

    const amount = planPrices[plan];
    if (!amount) {
      throw new BadRequestException('Invalid plan');
    }

    let orderId: string;
    let orderAmount: number;
    let orderCurrency: string;

    if (this.isRazorpayConfigured && this.razorpay) {
      try {
        // Create Razorpay order
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
      } catch (error: any) {
        console.error('Razorpay order creation failed:', error);
        throw new BadRequestException(
          error.message || 'Failed to create payment order. Please check Razorpay configuration.',
        );
      }
    } else {
      // Development mode: Create mock order
      orderId = `order_mock_${Date.now()}`;
      orderAmount = amount;
      orderCurrency = 'INR';
      console.warn('Razorpay not configured. Using mock order for development.');
    }

    // Create payment record
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

  private async activateServiceAfterPayment(serviceId: string, serviceType: string, userId: string) {
    // Activate service based on type
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

      // Voice/Video call credits are handled in chat service
      // Other services are handled by service providers
    }
  }
}

