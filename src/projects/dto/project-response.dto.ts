import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';

@Exclude()
export class ProjectResponseDto {
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
  title: string;

  @Expose()
  @ApiProperty()
  goal: string;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}

