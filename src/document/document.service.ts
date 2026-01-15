import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) { }

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
    });
  }

  async findOne(id: string, userId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, userId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto, userId: string) {
    // Verify document exists and belongs to user
    await this.findOne(id, userId);

    return this.prisma.document.update({
      where: { id },
      data: updateDocumentDto,
    });
  }

  async remove(id: string, userId: string) {
    // Verify document exists and belongs to user
    const document = await this.findOne(id, userId);

    await this.prisma.document.delete({
      where: { id },
    });

    return document;
  }
}

