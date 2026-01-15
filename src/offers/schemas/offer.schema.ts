import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OfferDocument = Offer & Document;

@Schema({ timestamps: true })
export class Offer {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Company', index: true })
  companyId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, type: Number })
  discount: number;

  createdAt: Date;
  updatedAt: Date;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);

// Add compound index for efficient company-scoped queries
OfferSchema.index({ companyId: 1, createdAt: -1 });

