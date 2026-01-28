import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserRoleGuard } from '../auth/guards/user-role.guard';
import { RoleProtected } from '../auth/decorators/role-protected.decorator';
import { Role } from '@prisma/client';
import type { User } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { DocumentService } from '../document/document.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateDocumentDto } from '../document/dto/create-document.dto';

@Controller('courses')
@UseGuards(AuthGuard('jwt'), UserRoleGuard)
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly documentService: DocumentService,
    private readonly cloudinaryService: CloudinaryService
  ) { }

  @Post()
  @RoleProtected(Role.ADMIN)
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.coursesService.findAllByUser(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOneWithFiles(id);
  }

  @Post(':id/files')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('id') courseId: string,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User
  ) {
    if (!file) throw new BadRequestException('No file provided');

    const result = await this.cloudinaryService.uploadDocument(file);

    const createDocumentDto: CreateDocumentDto = {
      name: file.originalname,
      filename: result.public_id,
      url: result.secure_url,
      mimetype: file.mimetype,
      size: file.size,
      courseId: courseId
    };

    return this.documentService.create(createDocumentDto, user.id);
  }

  @Post(':id/students')
  @RoleProtected(Role.TEACHER, Role.ADMIN)
  addStudent(@Param('id') id: string, @Body('email') email: string) {
    return this.coursesService.addStudent(id, email);
  }

  @Patch(':id')
  @RoleProtected(Role.ADMIN, Role.TEACHER)
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @RoleProtected(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}
