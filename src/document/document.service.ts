import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { PrismaService } from 'src/prisma/prisma.service';

const { PDFParse } = require('pdf-parse');

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) { }

  private cleanSpecialChars(text: string): string {
    if (!text) return '';

    // Diccionario de reemplazos más completo para salidas de PDF-Parse
    // Cubre casos con espacios (´ o), sin espacios (´o) y caracteres especiales (´ı)
    const patterns = [
      { regex: /´\s?a/gi, replacement: 'á' },
      { regex: /´\s?e/gi, replacement: 'é' },
      { regex: /´\s?[iı]/gi, replacement: 'í' },
      { regex: /´\s?o/gi, replacement: 'ó' },
      { regex: /´\s?u/gi, replacement: 'ú' },
      { regex: /˜\s?n/gi, replacement: 'ñ' },
      { regex: /´\s?A/gi, replacement: 'Á' },
      { regex: /´\s?E/gi, replacement: 'É' },
      { regex: /´\s?I/gi, replacement: 'Í' },
      { regex: /´\s?O/gi, replacement: 'Ó' },
      { regex: /´\s?U/gi, replacement: 'Ú' },
      { regex: /˜\s?N/gi, replacement: 'Ñ' }
    ];

    let result = text;
    patterns.forEach(({ regex, replacement }) => {
      result = result.replace(regex, replacement);
    });

    // Limpieza final y normalización
    return result
      .replace(/\s+/g, ' ')
      .trim()
      .normalize('NFC');
  }



  async generateDescription(file: Express.Multer.File): Promise<string> {
    if (file.mimetype !== 'application/pdf') {
      return `Archivo: ${file.originalname}`;
    }

    let parser: any = null;
    try {
      let safeName = file.originalname;
      try {
        safeName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      } catch (e) { }

      parser = new PDFParse({ data: file.buffer });

      // Obtener info y texto para un mejor análisis
      const info = await parser.getInfo().catch(() => ({}));
      const textResult = await parser.getText();
      const text = textResult?.text || '';

      if (!text || text.length < 5) {
        return `Documento académico: ${safeName}`;
      }

      // Limpiar el texto
      const cleanLines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 5);

      // Heurística de Contexto:
      // 1. Intentar obtener el título del PDF o la primera línea significativa
      const title = info.info?.Title || cleanLines[0] || safeName;

      // 2. Buscar palabras clave o secciones de "Objetivo" o "Contenido"
      const snippet = text.substring(0, 600).replace(/\s+/g, ' ');

      // 3. Generar una descripción con "personalidad"
      let description = `Este documento trata sobre "${title.substring(0, 100)}". `;

      const searchTerms = [/objetivo/i, /objective/i, /tema/i];
      if (searchTerms.some(regex => regex.test(snippet))) {
        const objMatch = snippet.match(/(?:objetivo|tema)[s]?[:\s]+([^.]+)/i);
        if (objMatch) description += `Su enfoque principal es ${objMatch[1].trim()}. `;
      }

      // Añadir un breve resumen del inicio
      const summary = cleanLines.slice(1, 4).join(' ').substring(0, 150);
      if (summary) {
        description += `Aborda temas como: ${summary}...`;
      } else {
        description += `Incluye información detallada sobre ${safeName.split('-')[0].split('.')[0]}.`;
      }

      return this.cleanSpecialChars(description);

    } catch (error) {
      console.error('Error parsing PDF:', error);
      return `Documento: ${file.originalname}`;
    } finally {
      if (parser && typeof parser.destroy === 'function') {
        await parser.destroy();
      }
    }
  }




  async create(createDocumentDto: CreateDocumentDto, userId: string) {
    return this.prisma.document.create({
      data: {
        ...createDocumentDto,
        userId,
      },
    });
  }


  async findAll(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: { name: true }
        }
      }
    });
  }

  async findOne(id: string, user: any) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: { course: true }
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Permission check: Admin, Owner, or Teacher of the course
    const isAdmin = user.role === 'ADMIN';
    const isOwner = document.userId === user.id;
    const isTeacherOfCourse = document.course?.teacherId === user.id;

    if (!isAdmin && !isOwner && !isTeacherOfCourse) {
      throw new NotFoundException(`No tienes permiso para acceder a este documento`);
    }

    return document;
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto, user: any) {
    await this.findOne(id, user);

    return this.prisma.document.update({
      where: { id },
      data: updateDocumentDto,
    });
  }

  async remove(id: string, user: any) {
    const document = await this.findOne(id, user);

    await this.prisma.document.delete({
      where: { id },
    });

    return document;
  }

}

