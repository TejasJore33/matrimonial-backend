import { HoroscopeService } from './horoscope.service';
export declare class HoroscopeController {
    private horoscopeService;
    constructor(horoscopeService: HoroscopeService);
    uploadHoroscope(user: any, file: Express.Multer.File, body: {
        birthTime?: string;
        birthPlace?: string;
        rashi?: string;
        nakshatra?: string;
        mangalDosha?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        profileId: string;
        horoscopeUrl: string | null;
        birthTime: string | null;
        birthPlace: string | null;
        rashi: string | null;
        nakshatra: string | null;
        mangalDosha: boolean | null;
        horoscopeData: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getHoroscope(user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        profileId: string;
        horoscopeUrl: string | null;
        birthTime: string | null;
        birthPlace: string | null;
        rashi: string | null;
        nakshatra: string | null;
        mangalDosha: boolean | null;
        horoscopeData: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    matchHoroscopes(user: any, userId: string): Promise<{
        id: string;
        createdAt: Date;
        user1Id: string;
        user2Id: string;
        horoscope1Id: string;
        horoscope2Id: string;
        ashtakootScore: number | null;
        mangalDoshaMatch: boolean | null;
        overallScore: number | null;
        matchDetails: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getHoroscopeMatch(user: any, userId: string): Promise<{
        horoscope1: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            profileId: string;
            horoscopeUrl: string | null;
            birthTime: string | null;
            birthPlace: string | null;
            rashi: string | null;
            nakshatra: string | null;
            mangalDosha: boolean | null;
            horoscopeData: import("@prisma/client/runtime/library").JsonValue | null;
        };
        horoscope2: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            profileId: string;
            horoscopeUrl: string | null;
            birthTime: string | null;
            birthPlace: string | null;
            rashi: string | null;
            nakshatra: string | null;
            mangalDosha: boolean | null;
            horoscopeData: import("@prisma/client/runtime/library").JsonValue | null;
        };
    } & {
        id: string;
        createdAt: Date;
        user1Id: string;
        user2Id: string;
        horoscope1Id: string;
        horoscope2Id: string;
        ashtakootScore: number | null;
        mangalDoshaMatch: boolean | null;
        overallScore: number | null;
        matchDetails: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
