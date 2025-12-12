import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookServiceDto, UpdateServiceStatusDto, RateServiceDto, ScheduleBookingDto } from './dto/service.dto';
import { SERVICES_CONFIG, SERVICE_CATEGORIES } from './services-config';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

  async getAvailableServices(category?: string) {
    let services = Object.values(SERVICES_CONFIG);

    if (category) {
      services = services.filter((s) => s.category === category);
    }

    return services.map((service) => ({
      id: service.id,
      name: service.name,
      category: service.category,
      description: service.description,
      price: service.price,
      priceInRupees: service.price / 100,
      formattedPrice: `₹${(service.price / 100).toLocaleString('en-IN')}`,
      duration: service.duration,
      requiresProvider: service.requiresProvider,
      isRecurring: service.isRecurring,
      features: service.features,
      icon: service.icon,
    }));
  }

  async getServiceCategories() {
    return SERVICE_CATEGORIES;
  }

  async bookService(userId: string, dto: BookServiceDto) {
    const serviceConfig = SERVICES_CONFIG[dto.serviceType];
    if (!serviceConfig) {
      throw new BadRequestException('Invalid service type');
    }

    // Create payment for the service
    const paymentResult = await this.paymentsService.createServicePayment(
      userId,
      dto.serviceType,
      serviceConfig.price,
      {
        scheduledAt: dto.scheduledAt,
        notes: dto.notes,
        ...dto.metadata,
      },
    );

    // Create service record
    const service = await (this.prisma as any).service.create({
      data: {
        userId,
        type: dto.serviceType as any,
        status: 'PENDING',
        paymentId: paymentResult.paymentId,
        amount: serviceConfig.price,
        metadata: {
          scheduledAt: dto.scheduledAt,
          notes: dto.notes,
          ...dto.metadata,
        },
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      },
    });

    // If service requires provider, assign one (or mark for assignment)
    if (serviceConfig.requiresProvider) {
      const provider = await this.findAvailableProvider(dto.serviceType);
      if (provider) {
        await (this.prisma as any).serviceBooking.create({
          data: {
            serviceId: service.id,
            providerId: provider.id,
            userId,
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
            status: 'PENDING',
          },
        });
      }
    }

    // Activate service immediately if it doesn't require provider and payment is completed
    if (paymentResult.isMockPayment) {
      await this.activateService(service.id, dto.serviceType, userId);
    }

    return {
      service,
      payment: paymentResult,
    };
  }

  private async activateService(serviceId: string, serviceType: string, userId: string) {
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
      case 'PRIORITY_LISTING':
        await this.prisma.profile.updateMany({
          where: { userId },
          data: { isHighlighted: true },
        });
        break;

      case 'KUNDALI_GENERATION':
        // Kundali generation is handled by service provider
        break;

      case 'MESSAGE_TRANSLATION':
      case 'ADVANCED_SEARCH_FILTERS':
      case 'REVERSE_SEARCH':
      case 'PROFILE_ANALYTICS':
      case 'MATCH_PREDICTIONS':
      case 'PRIVACY_PROTECTION':
      case 'REGIONAL_LANGUAGE_SUPPORT':
        // These services are activated via feature flags in user profile or subscription
        // They don't need immediate database updates
        break;

      // Other services that need immediate activation can be added here
    }

    // Update service status to confirmed
    await (this.prisma as any).service.update({
      where: { id: serviceId },
      data: { status: 'CONFIRMED' },
    });
  }

  async getUserServices(userId: string, status?: string) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return (this.prisma as any).service.findMany({
      where,
      include: {
        bookings: {
          include: {
            provider: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getServiceById(serviceId: string, userId: string) {
    const service = await (this.prisma as any).service.findUnique({
      where: { id: serviceId },
      include: {
        bookings: {
          include: {
            provider: true,
          },
        },
        payment: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return service;
  }

  async updateServiceStatus(serviceId: string, userId: string, dto: UpdateServiceStatusDto) {
    const service = await (this.prisma as any).service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Only allow status updates by admin or service provider
    // For now, allow user to cancel their own service
    if (dto.status === 'CANCELLED' && service.userId === userId) {
      return (this.prisma as any).service.update({
        where: { id: serviceId },
        data: {
          status: dto.status as any,
          notes: dto.notes,
        },
      });
    }

    // Admin/provider updates (would need role check in real implementation)
    return (this.prisma as any).service.update({
      where: { id: serviceId },
      data: {
        status: dto.status as any,
        notes: dto.notes,
        completedAt: dto.status === 'COMPLETED' ? new Date() : service.completedAt,
      },
    });
  }

  async rateService(serviceId: string, userId: string, dto: RateServiceDto) {
    const service = await (this.prisma as any).service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (service.status !== 'COMPLETED') {
      throw new BadRequestException('Service must be completed before rating');
    }

    return (this.prisma as any).service.update({
      where: { id: serviceId },
      data: {
        rating: dto.rating,
        review: dto.review,
      },
    });
  }

  async scheduleBooking(bookingId: string, userId: string, dto: ScheduleBookingDto) {
    const booking = await (this.prisma as any).serviceBooking.findUnique({
      where: { id: bookingId },
      include: { service: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return (this.prisma as any).serviceBooking.update({
      where: { id: bookingId },
      data: {
        scheduledAt: new Date(dto.scheduledAt),
        duration: dto.duration,
        notes: dto.notes,
        status: 'CONFIRMED',
      },
    });
  }

  async cancelService(serviceId: string, userId: string) {
    const service = await (this.prisma as any).service.findUnique({
      where: { id: serviceId },
      include: { payment: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (service.status === 'COMPLETED' || service.status === 'CANCELLED') {
      throw new BadRequestException('Service cannot be cancelled');
    }

    // Update service status
    await (this.prisma as any).service.update({
      where: { id: serviceId },
      data: { status: 'CANCELLED' },
    });

    // Cancel bookings
    await (this.prisma as any).serviceBooking.updateMany({
      where: { serviceId },
      data: { status: 'CANCELLED' },
    });

    // Refund logic would go here (if payment was completed)
    // For now, just mark as cancelled

    return { message: 'Service cancelled successfully' };
  }

  private async findAvailableProvider(serviceType: string) {
    // Find an available provider for the service type
    // In production, this would have more sophisticated logic
    return (this.prisma as any).serviceProvider.findFirst({
      where: {
        serviceType: serviceType as any,
        isActive: true,
      },
      orderBy: {
        rating: 'desc',
      },
    });
  }

  async getServiceProviders(serviceType?: string) {
    const where: any = { isActive: true };
    if (serviceType) {
      where.serviceType = serviceType;
    }

    return (this.prisma as any).serviceProvider.findMany({
      where,
      orderBy: {
        rating: 'desc',
      },
    });
  }
}

