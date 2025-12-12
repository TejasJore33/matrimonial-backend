export declare class BookServiceDto {
    serviceType: string;
    scheduledAt?: string;
    notes?: string;
    metadata?: any;
}
export declare class UpdateServiceStatusDto {
    status: string;
    notes?: string;
}
export declare class RateServiceDto {
    rating: number;
    review?: string;
}
export declare class ScheduleBookingDto {
    scheduledAt: string;
    duration?: number;
    notes?: string;
}
