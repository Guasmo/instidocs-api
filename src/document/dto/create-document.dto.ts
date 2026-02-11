import { IsNotEmpty, IsString, IsInt, Min, IsOptional } from 'class-validator';

export class CreateDocumentDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    filename: string;

    @IsNotEmpty()
    @IsString()
    url: string;

    @IsNotEmpty()
    @IsString()
    mimetype: string;

    @IsNotEmpty()
    @IsInt()
    @Min(0)
    size: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    authors?: string;

    @IsOptional()
    @IsString()
    courseId?: string;
}

