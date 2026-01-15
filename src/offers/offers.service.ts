import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Offer, OfferDocument } from './schemas/offer.schema';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { Company, CompanyDocument } from '../companies/schemas/company.schema';
import { CacheInvalidationService } from '../voiceflow/cache-invalidation.service';

@Injectable()
export class OffersService {
  constructor(
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    private cacheInvalidationService: CacheInvalidationService,
  ) {}

  async create(
    companyId: string,
    createOfferDto: CreateOfferDto,
  ): Promise<Offer> {
    const offer = new this.offerModel({
      ...createOfferDto,
      companyId: new Types.ObjectId(companyId),
    });

    const savedOffer = await offer.save();

    // Add offer to company's offers array
    await this.companyModel.findByIdAndUpdate(companyId, {
      $addToSet: { offers: savedOffer._id },
    });

    // Invalidate Voiceflow cache for this company
    await this.cacheInvalidationService.invalidateCompanyScript(companyId);

    return savedOffer;
  }

  async findAll(companyId: string): Promise<Offer[]> {
    return this.offerModel
      .find({ companyId: new Types.ObjectId(companyId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findOne(companyId: string, offerId: string): Promise<Offer> {
    if (!Types.ObjectId.isValid(offerId)) {
      throw new NotFoundException('Invalid offer ID format');
    }

    const offer = await this.offerModel
      .findOne({
        _id: new Types.ObjectId(offerId),
        companyId: new Types.ObjectId(companyId),
      })
      .lean()
      .exec();

    if (!offer) {
      throw new NotFoundException(
        'Offer not found or does not belong to this company',
      );
    }

    return offer;
  }

  async update(
    companyId: string,
    offerId: string,
    updateOfferDto: UpdateOfferDto,
  ): Promise<Offer> {
    if (!Types.ObjectId.isValid(offerId)) {
      throw new NotFoundException('Invalid offer ID format');
    }

    const offer = await this.offerModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(offerId),
          companyId: new Types.ObjectId(companyId),
        },
        { $set: updateOfferDto },
        { new: true },
      )
      .lean()
      .exec();

    if (!offer) {
      throw new NotFoundException(
        'Offer not found or does not belong to this company',
      );
    }

    // Invalidate Voiceflow cache for this company
    await this.cacheInvalidationService.invalidateCompanyScript(companyId);

    return offer;
  }

  async remove(companyId: string, offerId: string): Promise<void> {
    if (!Types.ObjectId.isValid(offerId)) {
      throw new NotFoundException('Invalid offer ID format');
    }

    const result = await this.offerModel
      .deleteOne({
        _id: new Types.ObjectId(offerId),
        companyId: new Types.ObjectId(companyId),
      })
      .lean()
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(
        'Offer not found or does not belong to this company',
      );
    }

    // Remove offer from company's offers array
    await this.companyModel.findByIdAndUpdate(companyId, {
      $pull: { offers: new Types.ObjectId(offerId) },
    });

    // Invalidate Voiceflow cache for this company
    await this.cacheInvalidationService.invalidateCompanyScript(companyId);
  }
}

