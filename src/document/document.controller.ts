// src/document/document.controller.ts
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
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Controller('documents')
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  @Auth()
  @Post('upload')
  @UseInterceptors(FileInterceptor('document'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: any,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No se proporcionó ningún documento');
      }

      // Subir a Cloudinary
      const result = await this.cloudinaryService.uploadDocument(file);

      // Generar descripción automática
      const description = await this.documentService.generateDescription(file);

      // Crear registro en base de datos
      const createDocumentDto: CreateDocumentDto = {
        name: file.originalname,
        filename: result.public_id, // Guardar el public_id de Cloudinary
        url: result.secure_url,
        mimetype: file.mimetype,
        size: file.size,
        description,
      };

      const document = await this.documentService.create(

        createDocumentDto,
        user.id,
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
    @GetUser() user: any,
  ) {
    return this.documentService.create(createDocumentDto, user.id);
  }


  @Auth()
  @Get()
  findAll(@GetUser() user: any) {
    return this.documentService.findAll(user.id);
  }


  @Auth()
  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: any) {
    return this.documentService.findOne(id, user);
  }


  @Auth()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @GetUser() user: any,
  ) {
    return this.documentService.update(id, updateDocumentDto, user);
  }


  @Auth()
  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser() user: any) {
    const document = await this.documentService.remove(id, user);

    // Eliminar de Cloudinary usando el filename (que es el public_id)
    try {
      await this.cloudinaryService.deleteFile(document.filename);
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
    }

    return {
      success: true,
      message: 'Documento eliminado exitosamente',
      data: document,
    };
  }
}