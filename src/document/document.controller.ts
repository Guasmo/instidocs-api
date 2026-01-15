import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Auth, GetUser } from 'src/auth/decorators';
import { ConfigService } from '@nestjs/config';
import * as path from 'node:path';
import * as fs from 'node:fs';

@Controller('documents')
export class DocumentController {
  private readonly baseUrl: string;
  private readonly uploadPath: string;

  constructor(
    private readonly documentService: DocumentService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get('IMAGE_BASE_URL') || 'http://localhost:3000';
    this.uploadPath = '/app/documents';
  }

  @Auth()
  @Post('upload')
  @UseInterceptors(FileInterceptor('document'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @GetUser('id') userId: string,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No se proporcionó ningún documento');
      }

      // Verify file was saved
      const filePath = path.join(this.uploadPath, file.filename);
      if (!fs.existsSync(filePath)) {
        throw new BadRequestException('Error al guardar el archivo');
      }

      // Generate public URL
      const publicUrl = `${this.baseUrl}/files/${file.filename}`;


      // Create document record in database
      const createDocumentDto: CreateDocumentDto = {
        name: file.originalname,
        filename: file.filename,
        url: publicUrl,
        mimetype: file.mimetype,
        size: file.size,
      };

      const document = await this.documentService.create(
        createDocumentDto,
        userId,
      );

      return {
        success: true,
        message: 'Documento subido exitosamente',
        data: document,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Auth()
  @Post()
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @GetUser('id') userId: string,
  ) {
    return this.documentService.create(createDocumentDto, userId);
  }

  @Auth()
  @Get()
  findAll(@GetUser('id') userId: string) {
    return this.documentService.findAll(userId);
  }

  @Auth()
  @Get(':id')
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.documentService.findOne(id, userId);
  }

  @Auth()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @GetUser('id') userId: string,
  ) {
    return this.documentService.update(id, updateDocumentDto, userId);
  }

  @Auth()
  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser('id') userId: string) {
    const document = await this.documentService.remove(id, userId);

    // Delete physical file
    try {
      const filePath = path.join(this.uploadPath, document.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    return {
      success: true,
      message: 'Documento eliminado exitosamente',
      data: document,
    };
  }
}


