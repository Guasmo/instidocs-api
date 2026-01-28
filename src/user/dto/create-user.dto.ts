import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator"
import { Role } from "@prisma/client"

export class CreateUserDto {
    @IsEmail()
    email: string

    @IsString()
    password: string

    @IsString()
    @IsOptional()
    fullName?: string

    @IsEnum(Role)
    @IsOptional()
    role?: Role

    @IsOptional()
    isActive?: boolean
}
