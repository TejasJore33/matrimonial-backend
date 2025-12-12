import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
export declare class DocumentsService {
    private prisma;
    private uploadService;
    constructor(prisma: PrismaService, uploadService: UploadService);
    uploadDocument(userId: string, file: Express.Multer.File, type: string, name: string, expiryDate?: Date): Promise<{
        name: string;
        url: string;
        type: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isVerified: boolean;
        verifiedAt: Date | null;
        userId: string;
        expiryDate: Date | null;
    }>;
    getDocuments(userId: string): Promise<{
        name: string;
        url: string;
        type: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isVerified: boolean;
        verifiedAt: Date | null;
        userId: string;
        expiryDate: Date | null;
    }[]>;
    getDocumentById(userId: string, documentId: string): Promise<{
        name: string;
        url: string;
        type: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isVerified: boolean;
        verifiedAt: Date | null;
        userId: string;
        expiryDate: Date | null;
    }>;
    deleteDocument(userId: string, documentId: string): Promise<{
        message: string;
    }>;
    verifyDocument(documentId: string, adminId: string): Promise<{
        name: string;
        url: string;
        type: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isVerified: boolean;
        verifiedAt: Date | null;
        userId: string;
        expiryDate: Date | null;
    }>;
    getExpiringDocuments(days?: number): Promise<({
        user: {
            email: string;
            mobile: string;
            id: string;
        };
    } & {
        name: string;
        url: string;
        type: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isVerified: boolean;
        verifiedAt: Date | null;
        userId: string;
        expiryDate: Date | null;
    })[]>;
}
