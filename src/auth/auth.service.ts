import { LoginDto } from './dto/loginDto';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import * as bcrypt from "bcryptjs";
import { Prisma } from '@prisma/client';
import { JwtPayload } from 'src/auth/interfaces';
import { RefreshDto } from './dto/refreshDto';
import { PrismaErrorHandlerService } from 'src/common/prisma-error-handler.services';


@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaErrorHandler: PrismaErrorHandlerService
  ) { }

  async register(createUserDto: CreateUserDto) {
    try {
      const { password, ...userDto } = createUserDto;
      const hashedPassword = bcrypt.hashSync(password, 10);

      const result = await this.prisma.user.create({
        data: {
          ...userDto,
          password: hashedPassword,
        }
      });
      return result;
    }
    catch (error) {
      if (this.prismaErrorHandler.isHttpException(error)) {
        throw error;
      }
      this.prismaErrorHandler.handleError(error, 'registrar usuario');
    }
  }


  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        email: true,
        password: true,
        id: true,
        isActive: true, // Include isActive
      },
    });

    if (!user) {
      throw new UnauthorizedException("Credentials are not valid");
    }

    // Check if user is active (default is true, so check for explicit false)
    if (user.isActive === false) {
      throw new UnauthorizedException("Credentials are not valid");
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Credentials are not valid");
    }

    const accessToken = this.getJwtToken(
      { id: user.id },
      { expiresIn: "2d" },
    );

    const refreshToken = this.getJwtToken(
      { id: user.id },
      { expiresIn: "7d" },
    );

    return {
      userId: user.id,
      accessToken,
      refreshToken,
    };
  }

  private getJwtToken(payload: JwtPayload, options?: JwtSignOptions) {
    const token = this.jwtService.sign(payload, options);
    return token;
  }
}