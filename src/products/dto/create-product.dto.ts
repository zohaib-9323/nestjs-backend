import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Premium Laptop', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'High-performance laptop for professionals',
    description: 'Product description',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 999.99, description: 'Product price' })
  @IsNumber()
  @Min(0)
  price: number;
}

