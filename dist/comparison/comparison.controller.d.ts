import { ComparisonService } from './comparison.service';
export declare class ComparisonController {
    private comparisonService;
    constructor(comparisonService: ComparisonService);
    compareProfiles(user: any, body: {
        profileIds: string[];
        includeMatchScores?: boolean;
    }): Promise<{
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
    getComparisonHistory(user: any): Promise<any>;
    getSavedComparisons(user: any): Promise<any>;
    deleteComparison(user: any, profileId: string): Promise<any>;
}
