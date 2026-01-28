import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserRoleGuard } from '../auth/guards/user-role.guard';
import { RoleProtected } from '../auth/decorators/role-protected.decorator';
import { Role } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
@UseGuards(AuthGuard('jwt'), UserRoleGuard)
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  @RoleProtected(Role.ADMIN, Role.TEACHER)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.userService.findAll(paginationDto);
  }

  @Get('search')
  @RoleProtected(Role.ADMIN, Role.TEACHER)
  searchByEmail(@Query('email') email: string) {
    return this.userService.findByEmail(email);
  }

  @Post('teacher')
  @RoleProtected(Role.ADMIN)
  createTeacher(@Body() createUserDto: CreateUserDto) {
    return this.userService.createTeacher(createUserDto);
  }

  @Post('admin')
  @RoleProtected(Role.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get('admin/all')
  @RoleProtected(Role.ADMIN)
  findAllUsers(@Query() paginationDto: PaginationDto, @Query('search') search: string) {
    return this.userService.findAllUsers(paginationDto, search);
  }

  @Get('teachers')
  @RoleProtected(Role.ADMIN)
  getTeachers() {
    return this.userService.findTeachers();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @RoleProtected(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.userService.softDelete(id);
  }
}
