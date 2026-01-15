import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';

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
}
