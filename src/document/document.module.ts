// src/document/document.module.ts
import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CloudinaryModule, // Importar módulo de Cloudinary
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule { }