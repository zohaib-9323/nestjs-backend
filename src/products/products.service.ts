import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Company, CompanyDocument } from '../companies/schemas/company.schema';
import { CacheInvalidationService } from '../voiceflow/cache-invalidation.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    private cacheInvalidationService: CacheInvalidationService,
  ) {}

  async create(
    companyId: string,
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    const product = new this.productModel({
      ...createProductDto,
      companyId: new Types.ObjectId(companyId),
    });

    const savedProduct = await product.save();

    // Add product to company's products array
    await this.companyModel.findByIdAndUpdate(companyId, {
      $addToSet: { products: savedProduct._id },
    });

    // Invalidate Voiceflow cache for this company
    await this.cacheInvalidationService.invalidateCompanyScript(companyId);

    return savedProduct;
  }

  async findAll(companyId: string): Promise<Product[]> {
    return this.productModel
      .find({ companyId: new Types.ObjectId(companyId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findOne(companyId: string, productId: string): Promise<Product> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new NotFoundException('Invalid product ID format');
    }

    const product = await this.productModel
      .findOne({
        _id: new Types.ObjectId(productId),
        companyId: new Types.ObjectId(companyId),
      })
      .lean()
      .exec();

    if (!product) {
      throw new NotFoundException(
        'Product not found or does not belong to this company',
      );
    }

    return product;
  }

  async update(
    companyId: string,
    productId: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new NotFoundException('Invalid product ID format');
    }

    const product = await this.productModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(productId),
          companyId: new Types.ObjectId(companyId),
        },
        { $set: updateProductDto },
        { new: true },
      )
      .lean()
      .exec();

    if (!product) {
      throw new NotFoundException(
        'Product not found or does not belong to this company',
      );
    }

    // Invalidate Voiceflow cache for this company
    await this.cacheInvalidationService.invalidateCompanyScript(companyId);

    return product;
  }

  async remove(companyId: string, productId: string): Promise<void> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new NotFoundException('Invalid product ID format');
    }

    const result = await this.productModel
      .deleteOne({
        _id: new Types.ObjectId(productId),
        companyId: new Types.ObjectId(companyId),
      })
      .lean()
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(
        'Product not found or does not belong to this company',
      );
    }

    // Remove product from company's products array
    await this.companyModel.findByIdAndUpdate(companyId, {
      $pull: { products: new Types.ObjectId(productId) },
    });

    // Invalidate Voiceflow cache for this company
    await this.cacheInvalidationService.invalidateCompanyScript(companyId);
  }
}

