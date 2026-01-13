import { Module, Global } from '@nestjs/common';
import { PrismaErrorHandlerService } from './prisma-error-handler.services';

@Global()
@Module({
  providers: [PrismaErrorHandlerService],
  exports: [PrismaErrorHandlerService],
})
export class CommonModule {}