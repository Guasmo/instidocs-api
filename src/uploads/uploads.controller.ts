// src/uploads/uploads.controller.ts
import {
	BadRequestException,
	Controller,
	Delete,
	Body,
	Post,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Auth } from 'src/auth/decorators';
import { UploadsService } from './uploads.service';

@Controller('upload')
export class UploadsController {
	constructor(private readonly uploadService: UploadsService) { }

	@Auth()
	@Post('image')
	@UseInterceptors(FileInterceptor('image'))
	async uploadImage(@UploadedFile() file: Express.Multer.File) {
		try {
			if (!file) {
				throw new BadRequestException('No se proporcionó ninguna imagen');
			}

			const imageUrl = await this.uploadService.processUploadedFile(file);

			return {
				success: true,
				message: 'Imagen subida exitosamente',
				data: {
					originalName: file.originalname,
					size: file.size,
					mimetype: file.mimetype,
					url: imageUrl,
				},
			};
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	@Auth()
	@Delete('image')
	async deleteImage(@Body('url') url: string) {
		try {
			if (!url) {
				throw new BadRequestException('URL es requerida');
			}

			const deleted = await this.uploadService.deleteImage(url);

			if (!deleted) {
				throw new BadRequestException('No se pudo eliminar la imagen');
			}

			return {
				success: true,
				message: 'Imagen eliminada exitosamente',
			};
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}
}