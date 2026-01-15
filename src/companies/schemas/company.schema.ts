import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  websiteUrl: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  ownerId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  members: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  products: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Project' }], default: [] })
  projects: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Offer' }], default: [] })
  offers: Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

export const CompanySchema = SchemaFactory.createForClass(Company);


