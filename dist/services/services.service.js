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
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const services_config_1 = require("./services-config");
const payments_service_1 = require("../payments/payments.service");
let ServicesService = class ServicesService {
    constructor(prisma, paymentsService) {
        this.prisma = prisma;
        this.paymentsService = paymentsService;
    }
    async getAvailableServices(category) {
        let services = Object.values(services_config_1.SERVICES_CONFIG);
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
        return services_config_1.SERVICE_CATEGORIES;
    }
    async bookService(userId, dto) {
        const serviceConfig = services_config_1.SERVICES_CONFIG[dto.serviceType];
        if (!serviceConfig) {
            throw new common_1.BadRequestException('Invalid service type');
        }
        const paymentResult = await this.paymentsService.createServicePayment(userId, dto.serviceType, serviceConfig.price, {
            scheduledAt: dto.scheduledAt,
            notes: dto.notes,
            ...dto.metadata,
        });
        const service = await this.prisma.service.create({
            data: {
                userId,
                type: dto.serviceType,
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
        if (serviceConfig.requiresProvider) {
            const provider = await this.findAvailableProvider(dto.serviceType);
            if (provider) {
                await this.prisma.serviceBooking.create({
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
        if (paymentResult.isMockPayment) {
            await this.activateService(service.id, dto.serviceType, userId);
        }
        return {
            service,
            payment: paymentResult,
        };
    }
    async activateService(serviceId, serviceType, userId) {
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
                break;
            case 'MESSAGE_TRANSLATION':
            case 'ADVANCED_SEARCH_FILTERS':
            case 'REVERSE_SEARCH':
            case 'PROFILE_ANALYTICS':
            case 'MATCH_PREDICTIONS':
            case 'PRIVACY_PROTECTION':
            case 'REGIONAL_LANGUAGE_SUPPORT':
                break;
        }
        await this.prisma.service.update({
            where: { id: serviceId },
            data: { status: 'CONFIRMED' },
        });
    }
    async getUserServices(userId, status) {
        const where = { userId };
        if (status) {
            where.status = status;
        }
        return this.prisma.service.findMany({
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
    async getServiceById(serviceId, userId) {
        const service = await this.prisma.service.findUnique({
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
            throw new common_1.NotFoundException('Service not found');
        }
        if (service.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return service;
    }
    async updateServiceStatus(serviceId, userId, dto) {
        const service = await this.prisma.service.findUnique({
            where: { id: serviceId },
        });
        if (!service) {
            throw new common_1.NotFoundException('Service not found');
        }
        if (dto.status === 'CANCELLED' && service.userId === userId) {
            return this.prisma.service.update({
                where: { id: serviceId },
                data: {
                    status: dto.status,
                    notes: dto.notes,
                },
            });
        }
        return this.prisma.service.update({
            where: { id: serviceId },
            data: {
                status: dto.status,
                notes: dto.notes,
                completedAt: dto.status === 'COMPLETED' ? new Date() : service.completedAt,
            },
        });
    }
    async rateService(serviceId, userId, dto) {
        const service = await this.prisma.service.findUnique({
            where: { id: serviceId },
        });
        if (!service) {
            throw new common_1.NotFoundException('Service not found');
        }
        if (service.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (service.status !== 'COMPLETED') {
            throw new common_1.BadRequestException('Service must be completed before rating');
        }
        return this.prisma.service.update({
            where: { id: serviceId },
            data: {
                rating: dto.rating,
                review: dto.review,
            },
        });
    }
    async scheduleBooking(bookingId, userId, dto) {
        const booking = await this.prisma.serviceBooking.findUnique({
            where: { id: bookingId },
            include: { service: true },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return this.prisma.serviceBooking.update({
            where: { id: bookingId },
            data: {
                scheduledAt: new Date(dto.scheduledAt),
                duration: dto.duration,
                notes: dto.notes,
                status: 'CONFIRMED',
            },
        });
    }
    async cancelService(serviceId, userId) {
        const service = await this.prisma.service.findUnique({
            where: { id: serviceId },
            include: { payment: true },
        });
        if (!service) {
            throw new common_1.NotFoundException('Service not found');
        }
        if (service.userId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (service.status === 'COMPLETED' || service.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Service cannot be cancelled');
        }
        await this.prisma.service.update({
            where: { id: serviceId },
            data: { status: 'CANCELLED' },
        });
        await this.prisma.serviceBooking.updateMany({
            where: { serviceId },
            data: { status: 'CANCELLED' },
        });
        return { message: 'Service cancelled successfully' };
    }
    async findAvailableProvider(serviceType) {
        return this.prisma.serviceProvider.findFirst({
            where: {
                serviceType: serviceType,
                isActive: true,
            },
            orderBy: {
                rating: 'desc',
            },
        });
    }
    async getServiceProviders(serviceType) {
        const where = { isActive: true };
        if (serviceType) {
            where.serviceType = serviceType;
        }
        return this.prisma.serviceProvider.findMany({
            where,
            orderBy: {
                rating: 'desc',
            },
        });
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payments_service_1.PaymentsService])
], ServicesService);
//# sourceMappingURL=services.service.js.map