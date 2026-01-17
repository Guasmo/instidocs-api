// src/uploads/uploads.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
	imports: [
		AuthModule,
		CloudinaryModule, // Importar módulo de Cloudinary
	],
	controllers: [UploadsController],
	providers: [UploadsService],
	exports: [UploadsService],
})
export class UploadsModule { }