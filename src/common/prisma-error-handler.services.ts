import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class PrismaErrorHandlerService {
  private readonly logger = new Logger(PrismaErrorHandlerService.name);

  handleError(
    error: any,
    operation: string,
  ): never {
    this.logger.error(`Error al ${operation}:`, {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    // P2002 - Unique constraint violation
    if (error.code === 'P2002') {
      throw new ConflictException('Ya existe un registro con esos datos únicos');
    }

    // P2025 - Record not found
    if (error.code === 'P2025') {
      throw new NotFoundException('Registro no encontrado');
    }

    // P2003 - Foreign key constraint violation
    if (error.code === 'P2003') {
      throw new BadRequestException(
        'No se puede completar la operación por dependencias'
      );
    }

    // P2014 - Invalid ID
    if (error.code === 'P2014') {
      throw new BadRequestException('ID inválido');
    }

    // P2021 - Table does not exist
    if (error.code === 'P2021') {
      this.logger.error('CRITICAL: Tabla no existe en la base de datos');
      throw new InternalServerErrorException(
        'Error de configuración del servidor'
      );
    }

    // P2024 - Connection timeout
    if (error.code === 'P2024') {
      this.logger.error('CRITICAL: Timeout de conexión a la base de datos');
      throw new InternalServerErrorException(
        'El servidor está experimentando problemas. Intenta nuevamente.'
      );
    }

    // Error genérico
    throw new InternalServerErrorException(
      `Error al ${operation}. Por favor intenta nuevamente.`
    );
  }

  /**
   * Verifica si un error es de NestJS (BadRequestException, etc.)
   * Para evitar convertirlo dos veces
   */
  isHttpException(error: any): boolean {
    return (
      error instanceof BadRequestException ||
      error instanceof NotFoundException ||
      error instanceof ConflictException ||
      error instanceof InternalServerErrorException
    );
  }
}