import { IsString, IsUrl, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCompanyDto {
  @ApiProperty({
    description: 'Company name',
    example: 'Acme Corporation',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Company website URL',
    example: 'https://www.acme.com',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @ApiProperty({
    description: 'Company phone number',
    example: '+1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}


