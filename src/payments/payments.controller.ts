import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateSubscriptionDto, CreateAddOnDto, VerifyPaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('subscription')
  @UseGuards(JwtAuthGuard)
  async createSubscription(@CurrentUser() user: any, @Body() dto: CreateSubscriptionDto) {
    // Log for debugging
    console.log('Creating subscription:', { userId: user.id, plan: dto.plan });
    return this.paymentsService.createSubscription(user.id, dto);
  }

  @Post('addon')
  @UseGuards(JwtAuthGuard)
  async createAddOn(@CurrentUser() user: any, @Body() dto: CreateAddOnDto) {
    return this.paymentsService.createAddOn(user.id, dto);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(@CurrentUser() user: any, @Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(dto.paymentId, dto.razorpayPaymentId, dto.razorpaySignature);
  }

  @Get('subscriptions')
  @UseGuards(JwtAuthGuard)
  async getSubscriptions(@CurrentUser() user: any) {
    return this.paymentsService.getSubscriptions(user.id);
  }

  @Get('subscriptions/active')
  @UseGuards(JwtAuthGuard)
  async getActiveSubscription(@CurrentUser() user: any) {
    return this.paymentsService.getActiveSubscription(user.id);
  }

  @Get('addons')
  @UseGuards(JwtAuthGuard)
  async getAddOns(@CurrentUser() user: any) {
    return this.paymentsService.getAddOns(user.id);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getPaymentHistory(@CurrentUser() user: any) {
    return this.paymentsService.getPaymentHistory(user.id);
  }

  @Get('plans')
  // No auth required - public endpoint
  async getAvailablePlans() {
    return this.paymentsService.getAvailablePlans();
  }

  @Post('coupon/apply')
  @UseGuards(JwtAuthGuard)
  async applyCoupon(@Body() body: { couponCode: string; amount: number }) {
    return this.paymentsService.applyCoupon(body.couponCode, body.amount);
  }

  @Post('gift')
  @UseGuards(JwtAuthGuard)
  async createGiftSubscription(
    @CurrentUser() user: any,
    @Body() body: { recipientEmail: string; plan: string; message?: string },
  ) {
    return this.paymentsService.createGiftSubscription(user.id, body.recipientEmail, body.plan, body.message);
  }
}

