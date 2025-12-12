import { AiService } from './ai.service';
export declare class AiController {
    private aiService;
    constructor(aiService: AiService);
    analyzePhotoQuality(body: {
        photoUrl: string;
    }): Promise<{
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
    getProfileRecommendations(user: any): Promise<{
        recommendations: string[];
        priority: "high" | "medium" | "low";
    }>;
}
