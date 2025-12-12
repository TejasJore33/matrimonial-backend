import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
export declare class AiService {
    private prisma;
    private uploadService;
    constructor(prisma: PrismaService, uploadService: UploadService);
    analyzePhotoQuality(photoUrl: string): Promise<{
        score: number;
        issues: string[];
        suggestions: string[];
    }>;
    autoTagProfile(profileId: string): Promise<string[]>;
    detectFraudulentProfile(userId: string): Promise<{
        isFraudulent: boolean;
        riskScore: number;
        reasons: string[];
    }>;
    getProfileRecommendations(userId: string): Promise<{
        recommendations: string[];
        priority: 'high' | 'medium' | 'low';
    }>;
}
