export interface ServiceConfig {
    id: string;
    name: string;
    category: string;
    description: string;
    price: number;
    duration?: number;
    requiresProvider: boolean;
    isRecurring: boolean;
    features: string[];
    icon?: string;
}
export declare const SERVICES_CONFIG: Record<string, ServiceConfig>;
export declare const SERVICE_CATEGORIES: string[];
