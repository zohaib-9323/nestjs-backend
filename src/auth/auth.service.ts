import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateSuperadminDto } from './dto/create-superadmin.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async createSuperadmin(createSuperadminDto: CreateSuperadminDto) {
    const secretKey = this.configService.get<string>('SUPERADMIN_SECRET_KEY');
    
    if (!secretKey) {
      throw new ForbiddenException(
        'Superadmin secret key not configured. Cannot create superadmin.',
      );
    }

    if (createSuperadminDto.secretKey !== secretKey) {
      throw new ForbiddenException('Invalid secret key');
    }

    // Check if superadmin already exists
    const existingSuperadmin = await this.usersService.findByRole(Role.SUPERADMIN);
    if (existingSuperadmin && existingSuperadmin.length > 0) {
      throw new BadRequestException('Superadmin already exists');
    }

    const hashedPassword = await bcrypt.hash(createSuperadminDto.password, 10);

    const user = await this.usersService.create({
      email: createSuperadminDto.email,
      password: hashedPassword,
      firstName: createSuperadminDto.firstName,
      lastName: createSuperadminDto.lastName,
      role: Role.SUPERADMIN,
    });

    const { password, ...userResponse } = user;
    return userResponse;
  }
}

