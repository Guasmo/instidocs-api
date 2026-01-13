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
        serveRoot: '/documents',
      },
    ),
    UserModule,
    AuthModule,
    PrismaModule,
    UploadsModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
