import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Company', index: true })
  companyId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  goal: string;

  createdAt: Date;
  updatedAt: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Add compound index for efficient company-scoped queries
ProjectSchema.index({ companyId: 1, createdAt: -1 });

