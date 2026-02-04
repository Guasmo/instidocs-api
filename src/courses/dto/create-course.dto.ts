import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsInt, Min } from 'class-validator';
import { Section } from '@prisma/client';

export class CreateCourseDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(Section)
    @IsNotEmpty()
    section: Section;

    @IsInt()
    @IsNotEmpty()
    @Min(2000)
    startYear: number;

    @IsInt()
    @IsNotEmpty()
    @Min(2000)
    endYear: number;


    @IsUUID()
    @IsNotEmpty()
    teacherId: string;
}

