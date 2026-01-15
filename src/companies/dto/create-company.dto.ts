import { IsString, IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Company name',
    example: 'Acme Corporation',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Company website URL',
    example: 'https://www.acme.com',
  })
  @IsUrl()
  @IsNotEmpty()
  websiteUrl: string;

  @ApiProperty({
    description: 'Company phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}


