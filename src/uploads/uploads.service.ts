import * as fs from "node:fs";
import * as path from "node:path";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class UploadsService {
	private readonly baseUrl: string;
	private readonly uploadPath: string;

	constructor(private readonly configService: ConfigService) {
		// URL base de tu servidor (configurable según ambiente)
		this.baseUrl =
			this.configService.get("IMAGE_BASE_URL") || "http://localhost:3000";
		this.uploadPath = "/app/images";
	}

	/**
	 * Procesa el archivo subido y retorna la URL pública
	 */
	processUploadedFile(file: Express.Multer.File): string {
		if (!file) {
			throw new Error("No se proporcionó ningún archivo");
		}

		// Verificar que el archivo se guardó correctamente
		const filePath = path.join(this.uploadPath, file.filename);
		if (!fs.existsSync(filePath)) {
			throw new Error("Error al guardar el archivo");
		}

		// Generar URL pública
		const publicUrl = `${this.baseUrl}/img/${file.filename}`;

		return publicUrl;
	}

	/**
	 * Elimina una imagen del servidor
	 */
	deleteImage(filename: string): boolean {
		try {
			const filePath = path.join(this.uploadPath, filename);
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
				return true;
			}
			return false;
		} catch (error) {
			console.error("Error al eliminar archivo:", error);
			return false;
		}
	}

	/**
	 * Extrae el nombre del archivo de una URL
	 */
	extractFilenameFromUrl(url: string): string {
		return path.basename(url);
	}

	/**
	 * Verifica si una imagen existe en el servidor
	 */
	imageExists(filename: string): boolean {
		const filePath = path.join(this.uploadPath, filename);
		return fs.existsSync(filePath);
	}
}
