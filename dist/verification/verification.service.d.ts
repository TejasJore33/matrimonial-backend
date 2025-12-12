import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
export declare class VerificationService {
    private prisma;
    private uploadService;
    constructor(prisma: PrismaService, uploadService: UploadService);
    submitVerification(userId: string, data: {
        idType: string;
        idNumber?: string;
        idPhoto?: Express.Multer.File;
        selfie?: Express.Multer.File;
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
    getVerification(userId: string): Promise<{
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
    approveVerification(userId: string, adminId: string): Promise<{
        message: string;
    }>;
    rejectVerification(userId: string, adminId: string, reason?: string): Promise<{
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
    verifyPhone(userId: string, otp: string): Promise<{
        message: string;
    }>;
    verifyEmail(userId: string, otp: string): Promise<{
        message: string;
    }>;
}
