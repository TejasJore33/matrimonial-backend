"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const cloudinary_1 = require("cloudinary");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let UploadService = UploadService_1 = class UploadService {
    constructor() {
        this.logger = new common_1.Logger(UploadService_1.name);
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        if (cloudName && apiKey && apiSecret &&
            apiKey !== 'your-api-key' &&
            cloudName !== 'your-cloud-name') {
            try {
                cloudinary_1.v2.config({
                    cloud_name: cloudName,
                    api_key: apiKey,
                    api_secret: apiSecret,
                });
                this.isConfigured = true;
                this.useLocalStorage = false;
                this.logger.log('Cloudinary configured successfully');
            }
            catch (error) {
                this.logger.error('Failed to configure Cloudinary:', error);
                this.isConfigured = false;
                this.setupLocalStorage();
            }
        }
        else {
            this.logger.warn('Cloudinary credentials not configured. Using local file storage for development.');
            this.logger.warn('For production, please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
            this.isConfigured = false;
            this.setupLocalStorage();
        }
    }
    setupLocalStorage() {
        this.useLocalStorage = true;
        this.uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
            this.logger.log(`Created local upload directory: ${this.uploadDir}`);
        }
        this.logger.log('Using local file storage for uploads');
    }
    async saveLocalFile(file, subfolder = '') {
        const folderPath = path.join(this.uploadDir, subfolder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = path.extname(file.originalname);
        const filename = `${timestamp}-${randomStr}${ext}`;
        const filepath = path.join(folderPath, filename);
        fs.writeFileSync(filepath, file.buffer);
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
        const relativePath = subfolder ? `${subfolder}/${filename}` : filename;
        const url = `${backendUrl}/uploads/${relativePath}`;
        const publicId = subfolder ? `${subfolder}/${filename}` : filename;
        return {
            url,
            publicId,
        };
    }
    async uploadImage(file, folder = 'profiles') {
        if (this.useLocalStorage) {
            return this.saveLocalFile(file, folder);
        }
        if (!this.isConfigured) {
            throw new common_1.BadRequestException('File upload service is not configured. Please configure Cloudinary credentials in your .env file.');
        }
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder,
                resource_type: 'image',
                transformation: [
                    { width: 800, height: 800, crop: 'limit' },
                    { quality: 'auto' },
                ],
            }, (error, result) => {
                if (error) {
                    this.logger.error('Cloudinary upload error:', error);
                    reject(new common_1.BadRequestException(`Failed to upload image: ${error.message}`));
                }
                else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                }
            });
            uploadStream.end(file.buffer);
        });
    }
    async uploadImageWithBlur(file, folder = 'profiles') {
        if (this.useLocalStorage) {
            return this.saveLocalFile(file, folder);
        }
        if (!this.isConfigured) {
            throw new common_1.BadRequestException('File upload service is not configured. Please configure Cloudinary credentials in your .env file.');
        }
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder,
                resource_type: 'image',
                transformation: [
                    { width: 800, height: 800, crop: 'limit' },
                    { quality: 'auto' },
                    { effect: 'blur:1000' },
                ],
            }, (error, result) => {
                if (error) {
                    this.logger.error('Cloudinary upload error:', error);
                    reject(new common_1.BadRequestException(`Failed to upload image: ${error.message}`));
                }
                else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                }
            });
            uploadStream.end(file.buffer);
        });
    }
    async uploadVideo(file, folder = 'videos') {
        if (this.useLocalStorage) {
            return this.saveLocalFile(file, folder);
        }
        if (!this.isConfigured) {
            throw new common_1.BadRequestException('File upload service is not configured. Please configure Cloudinary credentials in your .env file.');
        }
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder,
                resource_type: 'video',
                transformation: [
                    { width: 720, height: 1280, crop: 'limit' },
                    { quality: 'auto' },
                ],
            }, (error, result) => {
                if (error) {
                    this.logger.error('Cloudinary upload error:', error);
                    reject(new common_1.BadRequestException(`Failed to upload video: ${error.message}`));
                }
                else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                }
            });
            uploadStream.end(file.buffer);
        });
    }
    async uploadDocument(file, folder = 'documents') {
        if (this.useLocalStorage) {
            return this.saveLocalFile(file, folder);
        }
        if (!this.isConfigured) {
            throw new common_1.BadRequestException('File upload service is not configured. Please configure Cloudinary credentials in your .env file.');
        }
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder,
                resource_type: 'raw',
            }, (error, result) => {
                if (error) {
                    this.logger.error('Cloudinary upload error:', error);
                    reject(new common_1.BadRequestException(`Failed to upload document: ${error.message}`));
                }
                else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                }
            });
            uploadStream.end(file.buffer);
        });
    }
    async deleteImage(publicId) {
        if (this.useLocalStorage) {
            try {
                const filepath = path.join(this.uploadDir, publicId);
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                    this.logger.log(`Deleted local file: ${publicId}`);
                    return { result: 'ok' };
                }
                else {
                    this.logger.warn(`File not found for deletion: ${publicId}`);
                    return { result: 'not_found' };
                }
            }
            catch (error) {
                this.logger.error('Local file delete error:', error);
                throw new common_1.BadRequestException(`Failed to delete file: ${error.message}`);
            }
        }
        if (!this.isConfigured) {
            throw new common_1.BadRequestException('File upload service is not configured. Please configure Cloudinary credentials in your .env file.');
        }
        try {
            return await cloudinary_1.v2.uploader.destroy(publicId);
        }
        catch (error) {
            this.logger.error('Cloudinary delete error:', error);
            throw new common_1.BadRequestException(`Failed to delete image: ${error.message}`);
        }
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = UploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UploadService);
//# sourceMappingURL=upload.service.js.map