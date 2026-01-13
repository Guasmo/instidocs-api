import { IsNotEmpty, IsString, IsOptional, ValidateIf } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
	@ApiProperty({
		description: "The institutional email of the user",
		example: "john.doe@sudamericano.edu.ec",
		required: false,
	})
	@IsString()
	@IsNotEmpty({ message: "Either email or cedula must be provided" })
	email: string;

    @ApiProperty({
		description: "The password for the user account",
		example: "StrongP@ssw0rd",
		minLength: 8,
		maxLength: 20,
	})
	@IsString()
	@IsNotEmpty()
	password: string;
}
