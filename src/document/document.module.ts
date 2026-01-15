import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ConfigModule,
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = '/app/documents';
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const fileExtension = extname(file.originalname);
          const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
          cb(null, fileName);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB maximum
      },
    }),
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule { }
