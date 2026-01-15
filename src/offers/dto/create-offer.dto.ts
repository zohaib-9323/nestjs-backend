import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOfferDto {
  @ApiProperty({ example: 'New Year Sale', description: 'Offer title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 25,
    description: 'Discount percentage',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  discount: number;
}

