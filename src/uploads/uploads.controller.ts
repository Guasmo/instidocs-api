import {
	BadRequestException,
	Controller,
	Delete,
	Param,
	Post,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Auth } from "src/auth/decorators";
import { UploadsService } from "./uploads.service";

@Controller("upload")
export class UploadsController {
	constructor(
		private readonly uploadService: UploadsService,
	) { }

	@Auth()
	@Post("image")
	@UseInterceptors(FileInterceptor("image"))
	uploadImage(@UploadedFile() file: Express.Multer.File) {
		try {
			if (!file) {
				throw new BadRequestException("No se proporcionó ninguna imagen");
			}

			const imageUrl = this.uploadService.processUploadedFile(file);

			return {
				success: true,
				message: "Imagen subida exitosamente",
				data: {
					filename: file.filename,
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
	@Delete("image/:filename")
	deleteImage(@Param("filename") filename: string) {
		try {
			const deleted = this.uploadService.deleteImage(filename);

			if (!deleted) {
				throw new BadRequestException("No se pudo eliminar la imagen");
			}

			return {
				success: true,
				message: "Imagen eliminada exitosamente",
			};
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}
}
