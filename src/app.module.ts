import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { UploadsModule } from './uploads/uploads.module';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { DocumentModule } from './document/document.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CoursesModule } from './courses/courses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot(
      {
        rootPath: '/app/images',
        serveRoot: '/img',
      },
      {
        rootPath: '/app/documents',
        serveRoot: '/files',
      },
    ),

    UserModule,
    AuthModule,
    PrismaModule,
    UploadsModule,
    CommonModule,
    DocumentModule,
    CloudinaryModule,
    CoursesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
