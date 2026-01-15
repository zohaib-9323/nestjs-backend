import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'Mobile App Development', description: 'Project title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Build a mobile app for iOS and Android',
    description: 'Project goal',
  })
  @IsString()
  @IsNotEmpty()
  goal: string;
}

