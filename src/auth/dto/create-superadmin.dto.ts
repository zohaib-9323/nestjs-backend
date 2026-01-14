import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSuperadminDto {
  @ApiProperty({
    description: 'Superadmin email address',
    example: 'superadmin@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Superadmin password',
    example: 'SuperSecurePassword123!',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Superadmin first name',
    example: 'Super',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Superadmin last name',
    example: 'Admin',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Secret key to create superadmin (must match SUPERADMIN_SECRET_KEY)',
    example: 'your-secret-key-here',
  })
  @IsString()
  @IsNotEmpty()
  secretKey: string;
}


