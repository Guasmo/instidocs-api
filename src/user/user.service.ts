import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Role } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    return this.prisma.user.findMany({
      take: limit,
      skip: offset,
      where: {
        role: Role.STUDENT,
        isActive: true
      }
    });
  }

  async findAllUsers(paginationDto: PaginationDto, search?: string) {
    const { limit = 100, offset = 0 } = paginationDto;
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } }
      ];
    }

    return this.prisma.user.findMany({
      take: limit,
      skip: offset,
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  async findTeachers() {
    return this.prisma.user.findMany({
      where: {
        role: Role.TEACHER
      },
      select: {
        id: true,
        fullName: true,
        email: true
      }
    });
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async createTeacher(createUserDto: CreateUserDto) {
    return this.create({ ...createUserDto, role: Role.TEACHER });
  }

  async create(createUserDto: CreateUserDto) {
    const { password, role, ...userData } = createUserDto;

    // Check if user exists
    const userExists = await this.prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        role: role || Role.STUDENT,
        isActive: true
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);
    const { password, ...rest } = updateUserDto;
    const data: any = { ...rest };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: data,
    });
  }

  async softDelete(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
