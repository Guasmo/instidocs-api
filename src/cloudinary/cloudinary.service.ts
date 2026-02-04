// src/cloudinary/cloudinary.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    // Configurar Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Sube un archivo a Cloudinary
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'instidocs',
    resourceType: 'image' | 'raw' | 'video' | 'auto' = 'auto',
  ): Promise<UploadApiResponse> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: resourceType,
            public_id: file.originalname.split('.')[0].trim(),

            use_filename: true,
            unique_filename: true,
          },
          (error: UploadApiErrorResponse, result: UploadApiResponse) => {
            if (error) {
              this.logger.error(`Error uploading to Cloudinary: ${error.message}`);
              return reject(error);
            }
            this.logger.log(`File uploaded successfully: ${result.secure_url}`);
            resolve(result);
          },
        );

        if (file.buffer) {
          uploadStream.end(file.buffer);
        } else {
          reject(new Error('File buffer not found'));
        }
      });
    } catch (error) {
      this.logger.error(`Unexpected error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sube imagen optimizada (para /upload/image)
   */
  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'instidocs/images',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) throw Error("")
          resolve(result);
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Sube documento (para /documents/upload)
   */
  async uploadDocument(file: Express.Multer.File): Promise<UploadApiResponse> {
    return this.uploadFile(file, 'instidocs/documents', 'auto');
  }

  /**
   * Elimina archivo de Cloudinary
   */
  async deleteFile(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
      });
      this.logger.log(`File deleted: ${publicId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extrae public_id de una URL de Cloudinary
   * Ejemplo: https://res.cloudinary.com/demo/image/upload/v1234/folder/file.jpg
   * Retorna: folder/file
   */
  extractPublicId(url: string): string {
    const regex = /\/v\d+\/(.+)\.\w+$/;
    const match = url.match(regex);
    return match ? match[1] : '';
  }
}