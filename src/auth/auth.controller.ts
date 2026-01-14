import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateSuperadminDto } from './dto/create-superadmin.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return await this.authService.login(loginDto);
  }

  @Post('create-superadmin')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create superadmin (requires secret key)',
    description:
      'This endpoint allows creating a superadmin user. It requires a secret key that must match SUPERADMIN_SECRET_KEY environment variable. Only one superadmin can exist in the system.',
  })
  @ApiBody({ type: CreateSuperadminDto })
  @ApiResponse({
    status: 201,
    description: 'Superadmin created successfully',
  })
  @ApiResponse({ status: 400, description: 'Superadmin already exists' })
  @ApiResponse({ status: 403, description: 'Invalid secret key' })
  async createSuperadmin(@Body() createSuperadminDto: CreateSuperadminDto) {
    return await this.authService.createSuperadmin(createSuperadminDto);
  }
}


