export declare class UploadService {
    private readonly logger;
    private isConfigured;
    private useLocalStorage;
    private uploadDir;
    constructor();
    private setupLocalStorage;
    private saveLocalFile;
    uploadImage(file: Express.Multer.File, folder?: string): Promise<unknown>;
    uploadImageWithBlur(file: Express.Multer.File, folder?: string): Promise<unknown>;
    uploadVideo(file: Express.Multer.File, folder?: string): Promise<unknown>;
    uploadDocument(file: Express.Multer.File, folder?: string): Promise<unknown>;
    deleteImage(publicId: string): Promise<any>;
}
