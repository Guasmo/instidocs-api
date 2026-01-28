import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PrismaService } from '../prisma/prisma.service';
import { User, Role } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createCourseDto: CreateCourseDto) {
    const teacher = await this.prisma.user.findUnique({
      where: { id: createCourseDto.teacherId }
    });

    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new BadRequestException('Invalid teacher ID');
    }

    return this.prisma.course.create({
      data: createCourseDto
    });
  }

  async findAllByUser(user: User) {
    if (user.role === Role.ADMIN) {
      return this.prisma.course.findMany({
        include: { teacher: { select: { fullName: true, email: true } } }
      });
    }

    if (user.role === Role.TEACHER) {
      return this.prisma.course.findMany({
        where: { teacherId: user.id },
        include: { _count: { select: { students: true, documents: true } } }
      });
    }

    return this.prisma.course.findMany({
      where: {
        students: { some: { id: user.id } }
      },
      include: { teacher: { select: { fullName: true } } }
    });
  }

  async findOneWithFiles(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        documents: {
          include: {
            user: { select: { email: true, fullName: true } }
          }
        },
        teacher: { select: { fullName: true, email: true } },
        students: { select: { fullName: true, email: true } }
      }
    });

    if (!course) throw new NotFoundException(`Course with ID ${id} not found`);
    return course;
  }

  async addStudent(courseId: string, email: string) {
    const student = await this.prisma.user.findUnique({ where: { email } });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        students: {
          connect: { id: student.id }
        }
      }
    });
  }

  findAll() {
    return `This action returns all courses`;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException(`Course with ID ${id} not found`);

    if (updateCourseDto.teacherId) {
      const teacher = await this.prisma.user.findUnique({
        where: { id: updateCourseDto.teacherId }
      });

      if (!teacher || teacher.role !== Role.TEACHER) {
        throw new BadRequestException('Invalid teacher ID');
      }
    }

    return this.prisma.course.update({
      where: { id },
      data: updateCourseDto
    });
  }

  async remove(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException(`Course with ID ${id} not found`);

    return this.prisma.course.delete({
      where: { id }
    });
  }
}
