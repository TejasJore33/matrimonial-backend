import { VerificationService } from './verification.service';
export declare class VerificationController {
    private verificationService;
    constructor(verificationService: VerificationService);
    submitVerification(user: any, body: {
        idType: string;
        idNumber?: string;
    }, files?: Express.Multer.File[]): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        userId: string;
        reviewedBy: string | null;
        reviewedAt: Date | null;
        idType: string;
        idNumber: string | null;
        idPhotoUrl: string | null;
        selfieUrl: string | null;
    }>;
    getVerification(user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        userId: string;
        reviewedBy: string | null;
        reviewedAt: Date | null;
        idType: string;
        idNumber: string | null;
        idPhotoUrl: string | null;
        selfieUrl: string | null;
    }>;
    approveVerification(user: any, userId: string): Promise<{
        message: string;
    }>;
    rejectVerification(user: any, userId: string, body?: {
        reason?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        userId: string;
        reviewedBy: string | null;
        reviewedAt: Date | null;
        idType: string;
        idNumber: string | null;
        idPhotoUrl: string | null;
        selfieUrl: string | null;
    }>;
    verifyPhone(user: any, body: {
        otp: string;
    }): Promise<{
        message: string;
    }>;
    verifyEmail(user: any, body: {
        otp: string;
    }): Promise<{
        message: string;
    }>;
}
