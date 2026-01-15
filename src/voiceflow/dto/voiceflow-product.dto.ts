import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class VoiceflowProductDto {
  @Expose()
  @ApiProperty({ example: 'Premium Laptop' })
  name: string;

  @Expose()
  @ApiProperty({ example: 'High-performance laptop for professionals' })
  description: string;

  @Expose()
  @ApiProperty({ example: 999.99 })
  price: number;
}

