import { PrismaService } from '../prisma/prisma.service';
export declare class ComparisonService {
    private prisma;
    constructor(prisma: PrismaService);
    compareProfiles(userId: string, profileIds: string[]): Promise<{
        profiles: {
            profileId: string;
            name: string;
            age: number;
            height: number;
            education: string;
            occupation: string;
            income: number;
            location: string;
            religion: string;
            caste: string;
            motherTongue: string;
            maritalStatus: import(".prisma/client").$Enums.MaritalStatus;
            familyType: import(".prisma/client").$Enums.FamilyType;
            diet: import(".prisma/client").$Enums.Diet;
            smoking: boolean;
            drinking: boolean;
            photo: string;
        }[];
        differences: any;
    }>;
    getComparisonHistory(userId: string): Promise<any>;
    private calculateAge;
    private findDifferences;
    getComparisonWithMatchScores(userId: string, profileIds: string[]): Promise<{
        matchScores: {
            profileId: string;
            matchScore: any;
            scores: any;
            matchReasons: any;
            isReverseMatch: any;
        }[];
        profiles: {
            profileId: string;
            name: string;
            age: number;
            height: number;
            education: string;
            occupation: string;
            income: number;
            location: string;
            religion: string;
            caste: string;
            motherTongue: string;
            maritalStatus: import(".prisma/client").$Enums.MaritalStatus;
            familyType: import(".prisma/client").$Enums.FamilyType;
            diet: import(".prisma/client").$Enums.Diet;
            smoking: boolean;
            drinking: boolean;
            photo: string;
        }[];
        differences: any;
    }>;
    getSavedComparisons(userId: string): Promise<any>;
    deleteComparison(userId: string, profileId: string): Promise<any>;
}
