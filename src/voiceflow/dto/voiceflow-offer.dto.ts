import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class VoiceflowOfferDto {
  @Expose()
  @ApiProperty({ example: 'New Year Sale' })
  title: string;

  @Expose()
  @ApiProperty({ example: 25 })
  discount: number;
}

