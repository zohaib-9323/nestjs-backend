import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { Offer, OfferSchema } from './schemas/offer.schema';
import { Company, CompanySchema } from '../companies/schemas/company.schema';
import { VoiceflowModule } from '../voiceflow/voiceflow.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Offer.name, schema: OfferSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    forwardRef(() => VoiceflowModule),
  ],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}

