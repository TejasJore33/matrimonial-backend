import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
export declare class HoroscopeService {
    private prisma;
    private uploadService;
    constructor(prisma: PrismaService, uploadService: UploadService);
    uploadHoroscope(userId: string, file: Express.Multer.File, data: {
        birthTime?: string;
        birthPlace?: string;
        rashi?: string;
        nakshatra?: string;
        mangalDosha?: boolean;
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
    getHoroscope(userId: string): Promise<{
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
    matchHoroscopes(user1Id: string, user2Id: string): Promise<{
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
    getHoroscopeMatch(user1Id: string, user2Id: string): Promise<{
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
    private calculateCompatibility;
}
