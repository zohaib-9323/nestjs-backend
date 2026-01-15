import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class VoiceflowProjectDto {
  @Expose()
  @ApiProperty({ example: 'Mobile App Development' })
  title: string;

  @Expose()
  @ApiProperty({ example: 'Build a mobile app for iOS and Android' })
  goal: string;
}

