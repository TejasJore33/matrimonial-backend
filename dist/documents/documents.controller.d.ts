import { DocumentsService } from './documents.service';
export declare class DocumentsController {
    private documentsService;
    constructor(documentsService: DocumentsService);
    uploadDocument(user: any, file: Express.Multer.File, body: {
        type: string;
        name: string;
        expiryDate?: string;
    }): Promise<{
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
    getDocuments(user: any): Promise<{
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
    getDocument(user: any, id: string): Promise<{
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
    deleteDocument(user: any, id: string): Promise<{
        message: string;
    }>;
    verifyDocument(user: any, id: string): Promise<{
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
    getExpiringDocuments(days?: string): Promise<({
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
