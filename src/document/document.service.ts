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

