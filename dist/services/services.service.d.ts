import { PrismaService } from '../prisma/prisma.service';
import { BookServiceDto, UpdateServiceStatusDto, RateServiceDto, ScheduleBookingDto } from './dto/service.dto';
import { PaymentsService } from '../payments/payments.service';
export declare class ServicesService {
    private prisma;
    private paymentsService;
    constructor(prisma: PrismaService, paymentsService: PaymentsService);
    getAvailableServices(category?: string): Promise<{
        id: string;
        name: string;
        category: string;
        description: string;
        price: number;
        priceInRupees: number;
        formattedPrice: string;
        duration: number;
        requiresProvider: boolean;
        isRecurring: boolean;
        features: string[];
        icon: string;
    }[]>;
    getServiceCategories(): Promise<string[]>;
    bookService(userId: string, dto: BookServiceDto): Promise<{
        service: any;
        payment: {
            orderId: string;
            amount: number;
            currency: string;
            paymentId: string;
            isMockPayment: boolean;
        };
    }>;
    private activateService;
    getUserServices(userId: string, status?: string): Promise<any>;
    getServiceById(serviceId: string, userId: string): Promise<any>;
    updateServiceStatus(serviceId: string, userId: string, dto: UpdateServiceStatusDto): Promise<any>;
    rateService(serviceId: string, userId: string, dto: RateServiceDto): Promise<any>;
    scheduleBooking(bookingId: string, userId: string, dto: ScheduleBookingDto): Promise<any>;
    cancelService(serviceId: string, userId: string): Promise<{
        message: string;
    }>;
    private findAvailableProvider;
    getServiceProviders(serviceType?: string): Promise<any>;
}
