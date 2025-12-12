import { UploadService } from './upload.service';
export declare class UploadController {
    private uploadService;
    constructor(uploadService: UploadService);
    uploadImage(file: Express.Multer.File): Promise<unknown>;
    uploadImageWithBlur(file: Express.Multer.File): Promise<unknown>;
    uploadVideo(file: Express.Multer.File): Promise<unknown>;
    uploadDocument(file: Express.Multer.File): Promise<unknown>;
}
