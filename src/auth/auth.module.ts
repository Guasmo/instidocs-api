import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrismaModule } from "src/prisma/prisma.module";
import { JwtStrategy } from "src/auth/strategy/jwt.strategy";

@Module({
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy],
	imports: [
		ConfigModule,
		PrismaModule,
		PassportModule.register({ defaultStrategy: "jwt" }),
		JwtModule.registerAsync({
			imports: [ConfigModule, PassportModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				return {
					secret: configService.get("JWT_SECRET"),
					signOptions: {
						expiresIn: "2d",
					},
				};
			},
		}),
	],
	exports: [JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule { }
