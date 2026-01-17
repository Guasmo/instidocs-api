// src/uploads/uploads.service.ts
import { Injectable } from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class UploadsService {
	constructor(private readonly cloudinaryService: CloudinaryService) { }

	/**
	 * Procesa el archivo subido y retorna la URL pública de Cloudinary
	 */
	async processUploadedFile(file: Express.Multer.File): Promise<string> {
		if (!file) {
			throw new Error('No se proporcionó ningún archivo');
		}

		// Subir a Cloudinary
		const result = await this.cloudinaryService.uploadImage(file);

		// Retornar URL pública
		return result.secure_url;
	}

	/**
	 * Elimina una imagen de Cloudinary
	 */
	async deleteImage(urlOrPublicId: string): Promise<boolean> {
		try {
			const publicId = this.cloudinaryService.extractPublicId(urlOrPublicId);
			await this.cloudinaryService.deleteFile(publicId);
			return true;
		} catch (error) {
			console.error('Error al eliminar archivo:', error);
			return false;
		}
	}

	/**
	 * Extrae el public_id de una URL
	 */
	extractPublicIdFromUrl(url: string): string {
		return this.cloudinaryService.extractPublicId(url);
	}
}