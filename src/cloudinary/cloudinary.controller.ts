// src/controllers/upload.controller.ts
import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) { }

  /**
   * Subir una sola imagen
   * POST /upload/image
   */
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      const result = await this.cloudinaryService.uploadImage(file);

      return {
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          size: result.bytes,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Subir múltiples imágenes
   * POST /upload/images
   */
  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10)) // Máximo 10 archivos
  async uploadImages(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    try {
      const uploadPromises = files.map((file) => this.cloudinaryService.uploadImage(file));
      const results = await Promise.all(uploadPromises);

      return {
        success: true,
        message: `${results.length} images uploaded successfully`,
        data: results.map((result) => ({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
        })),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload images: ${error.message}`);
    }
  }

  /**
   * Subir documento (PDF, Word, Excel, etc.)
   * POST /upload/document
   */
  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB para documentos
          new FileTypeValidator({ fileType: /(pdf|doc|docx|xls|xlsx|txt)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      const result = await this.cloudinaryService.uploadDocument(file);

      return {
        success: true,
        message: 'Document uploaded successfully',
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          size: result.bytes,
          originalName: file.originalname,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload document: ${error.message}`);
    }
  }

  /**
   * Eliminar archivo por URL
   * DELETE /upload
   */
  @Delete()
  async deleteFile(@Body('url') url: string) {
    if (!url) {
      throw new BadRequestException('URL is required');
    }

    try {
      const publicId = this.cloudinaryService.extractPublicId(url);
      const result = await this.cloudinaryService.deleteFile(publicId);

      return {
        success: true,
        message: 'File deleted successfully',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Eliminar múltiples archivos
   * DELETE /upload/batch
   */
  @Delete('batch')
  async deleteFiles(@Body('urls') urls: string[], publicId: string) {
    if (!urls || urls.length === 0) {
      throw new BadRequestException('URLs array is required');
    }

    try {
      const publicIds = urls.map((url) => this.cloudinaryService.extractPublicId(url));
      const result = await this.cloudinaryService.deleteFile(publicId);

      return {
        success: true,
        message: `${publicIds.length} files deleted successfully`,
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete files: ${error.message}`);
    }
  }
}