import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private isConfigured: boolean;
  private useLocalStorage: boolean;
  private uploadDir: string;

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret && 
        apiKey !== 'your-api-key' && 
        cloudName !== 'your-cloud-name') {
      try {
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
        });
        this.isConfigured = true;
        this.useLocalStorage = false;
        this.logger.log('Cloudinary configured successfully');
      } catch (error) {
        this.logger.error('Failed to configure Cloudinary:', error);
        this.isConfigured = false;
        this.setupLocalStorage();
      }
    } else {
      this.logger.warn('Cloudinary credentials not configured. Using local file storage for development.');
      this.logger.warn('For production, please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
      this.isConfigured = false;
      this.setupLocalStorage();
    }
  }

  private setupLocalStorage() {
    this.useLocalStorage = true;
    // Create uploads directory in backend folder
    this.uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created local upload directory: ${this.uploadDir}`);
    }
    this.logger.log('Using local file storage for uploads');
  }

  private async saveLocalFile(file: Express.Multer.File, subfolder: string = ''): Promise<{ url: string; publicId: string }> {
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

    // Return URL that can be served by the backend
    // Use full URL with backend base URL for frontend access
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    const relativePath = subfolder ? `${subfolder}/${filename}` : filename;
    const url = `${backendUrl}/uploads/${relativePath}`;
    
    // Store the relative path as publicId for deletion
    const publicId = subfolder ? `${subfolder}/${filename}` : filename;
    
    return {
      url,
      publicId,
    };
  }

  async uploadImage(file: Express.Multer.File, folder: string = 'profiles') {
    if (this.useLocalStorage) {
      return this.saveLocalFile(file, folder);
    }

    if (!this.isConfigured) {
      throw new BadRequestException(
        'File upload service is not configured. Please configure Cloudinary credentials in your .env file.'
      );
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload error:', error);
            reject(new BadRequestException(`Failed to upload image: ${error.message}`));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async uploadImageWithBlur(file: Express.Multer.File, folder: string = 'profiles') {
    if (this.useLocalStorage) {
      // For local storage, we just save the file (blur can be added later if needed)
      return this.saveLocalFile(file, folder);
    }

    if (!this.isConfigured) {
      throw new BadRequestException(
        'File upload service is not configured. Please configure Cloudinary credentials in your .env file.'
      );
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { effect: 'blur:1000' }, // Blurred version
          ],
        },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload error:', error);
            reject(new BadRequestException(`Failed to upload image: ${error.message}`));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async uploadVideo(file: Express.Multer.File, folder: string = 'videos') {
    if (this.useLocalStorage) {
      return this.saveLocalFile(file, folder);
    }

    if (!this.isConfigured) {
      throw new BadRequestException(
        'File upload service is not configured. Please configure Cloudinary credentials in your .env file.'
      );
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'video',
          transformation: [
            { width: 720, height: 1280, crop: 'limit' },
            { quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload error:', error);
            reject(new BadRequestException(`Failed to upload video: ${error.message}`));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async uploadDocument(file: Express.Multer.File, folder: string = 'documents') {
    if (this.useLocalStorage) {
      return this.saveLocalFile(file, folder);
    }

    if (!this.isConfigured) {
      throw new BadRequestException(
        'File upload service is not configured. Please configure Cloudinary credentials in your .env file.'
      );
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'raw', // For PDF and other documents
        },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload error:', error);
            reject(new BadRequestException(`Failed to upload document: ${error.message}`));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteImage(publicId: string) {
    if (this.useLocalStorage) {
      // For local storage, publicId is the relative path (e.g., "profiles/123-abc.jpg")
      try {
        const filepath = path.join(this.uploadDir, publicId);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          this.logger.log(`Deleted local file: ${publicId}`);
          return { result: 'ok' };
        } else {
          this.logger.warn(`File not found for deletion: ${publicId}`);
          return { result: 'not_found' };
        }
      } catch (error: any) {
        this.logger.error('Local file delete error:', error);
        throw new BadRequestException(`Failed to delete file: ${error.message}`);
      }
    }

    if (!this.isConfigured) {
      throw new BadRequestException(
        'File upload service is not configured. Please configure Cloudinary credentials in your .env file.'
      );
    }

    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      this.logger.error('Cloudinary delete error:', error);
      throw new BadRequestException(`Failed to delete image: ${error.message}`);
    }
  }
}

