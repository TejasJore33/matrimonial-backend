import { ServicesService } from './services.service';
import { BookServiceDto, UpdateServiceStatusDto, RateServiceDto, ScheduleBookingDto } from './dto/service.dto';
export declare class ServicesController {
    private servicesService;
    constructor(servicesService: ServicesService);
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
    getServiceProviders(serviceType?: string): Promise<any>;
    bookService(user: any, dto: BookServiceDto): Promise<{
        service: any;
        payment: {
            orderId: string;
            amount: number;
            currency: string;
            paymentId: string;
            isMockPayment: boolean;
        };
    }>;
    getMyServices(user: any, status?: string): Promise<any>;
    getService(user: any, id: string): Promise<any>;
    updateServiceStatus(user: any, id: string, dto: UpdateServiceStatusDto): Promise<any>;
    rateService(user: any, id: string, dto: RateServiceDto): Promise<any>;
    cancelService(user: any, id: string): Promise<{
        message: string;
    }>;
    scheduleBooking(user: any, bookingId: string, dto: ScheduleBookingDto): Promise<any>;
}
