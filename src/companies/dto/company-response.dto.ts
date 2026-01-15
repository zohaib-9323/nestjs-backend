import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';

@Exclude()
export class CompanyResponseDto {
  @Expose()
  @ApiProperty()
  @Transform(({ value }) => value.toString())
  _id: Types.ObjectId;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  websiteUrl: string;

  @Expose()
  @ApiProperty()
  phoneNumber: string;

  @Expose()
  @ApiProperty()
  @Transform(({ value }) => (value ? value.toString() : value))
  ownerId: Types.ObjectId;

  @Expose()
  @ApiProperty({ type: [String] })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((id) => id.toString()) : [],
  )
  members: Types.ObjectId[];

  @Expose()
  @ApiProperty({ type: [String] })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((id) => id.toString()) : [],
  )
  products: Types.ObjectId[];

  @Expose()
  @ApiProperty({ type: [String] })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((id) => id.toString()) : [],
  )
  projects: Types.ObjectId[];

  @Expose()
  @ApiProperty({ type: [String] })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((id) => id.toString()) : [],
  )
  offers: Types.ObjectId[];

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}



