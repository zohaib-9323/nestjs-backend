import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';

@Exclude()
export class ProductResponseDto {
  @Expose()
  @ApiProperty()
  @Transform(({ value }) => value.toString())
  _id: Types.ObjectId;

  @Expose()
  @ApiProperty()
  @Transform(({ value }) => value.toString())
  companyId: Types.ObjectId;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  description: string;

  @Expose()
  @ApiProperty()
  price: number;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}

