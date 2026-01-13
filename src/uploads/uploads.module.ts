import { extname } from "node:path";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MulterModule } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { AuthModule } from "src/auth/auth.module";
import { PrismaModule } from "src/prisma/prisma.module";
import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";

@Module({
	imports: [
		PrismaModule,
		AuthModule,
		MulterModule.register({
			storage: diskStorage({
				destination: (req, file, cb) => {
					// Ruta donde se guardarán las imágenes (volumen Docker)
					const uploadPath = "/app/images";
					cb(null, uploadPath);
				},
				filename: (req, file, cb) => {
					// Generar nombre único para evitar conflictos
					const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
					const fileExtension = extname(file.originalname);
					const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
					cb(null, fileName);
				},
			}),
			fileFilter: (req, file, cb) => {
				// Filtrar solo imágenes
				if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
					return cb(new Error("Solo se permiten archivos de imagen"), false);
				}
				cb(null, true);
			},
			limits: {
				fileSize: 5 * 1024 * 1024, // 5MB máximo
			},
		}),
	],
	controllers: [UploadsController],
	providers: [UploadsService, ConfigService],
	exports: [UploadsService, ConfigService],
})
export class UploadsModule { }
