import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VoiceflowService } from './voiceflow.service';
import { WebhookService } from './webhook.service';
import { VoiceflowController } from './voiceflow.controller';
import { CacheInvalidationService } from './cache-invalidation.service';
import { Company, CompanySchema } from '../companies/schemas/company.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Offer, OfferSchema } from '../offers/schemas/offer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Product.name, schema: ProductSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Offer.name, schema: OfferSchema },
    ]),
  ],
  controllers: [VoiceflowController],
  providers: [VoiceflowService, WebhookService, CacheInvalidationService],
  exports: [VoiceflowService, WebhookService, CacheInvalidationService],
})
export class VoiceflowModule {}

