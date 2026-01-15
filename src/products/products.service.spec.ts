import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ProductsService } from './products.service';
import { Product } from './schemas/product.schema';
import { Company } from '../companies/schemas/company.schema';
import { CacheInvalidationService } from '../voiceflow/cache-invalidation.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let productModel: any;
  let companyModel: any;
  let cacheInvalidationService: CacheInvalidationService;

  const mockCompanyId = new Types.ObjectId();
  const mockProductId = new Types.ObjectId();

  const mockProduct = {
    _id: mockProductId,
    companyId: mockCompanyId,
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    save: jest.fn().mockResolvedValue(this),
  };

  beforeEach(async () => {
    const mockProductModel = {
      constructor: jest.fn().mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue({ ...data, _id: mockProductId }),
      })),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockProduct]),
          }),
        }),
      }),
      findOne: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProduct),
        }),
      }),
      findOneAndUpdate: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProduct),
        }),
      }),
      deleteOne: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
        }),
      }),
    };

    const mockCompanyModel = {
      findByIdAndUpdate: jest.fn().mockResolvedValue({}),
    };

    const mockCacheInvalidationService = {
      invalidateCompanyScript: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
        {
          provide: getModelToken(Company.name),
          useValue: mockCompanyModel,
        },
        {
          provide: CacheInvalidationService,
          useValue: mockCacheInvalidationService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productModel = module.get(getModelToken(Product.name));
    companyModel = module.get(getModelToken(Company.name));
    cacheInvalidationService = module.get<CacheInvalidationService>(
      CacheInvalidationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product and invalidate cache', async () => {
      const createDto = {
        name: 'New Product',
        description: 'New Description',
        price: 149.99,
      };

      // Mock the model constructor
      productModel.constructor = jest.fn().mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue({ ...data, _id: mockProductId }),
      }));

      const result = await service.create(mockCompanyId.toString(), createDto);

      expect(companyModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockCompanyId.toString(),
        { $addToSet: { products: mockProductId } },
      );
      expect(cacheInvalidationService.invalidateCompanyScript).toHaveBeenCalledWith(
        mockCompanyId.toString(),
      );
    });
  });

  describe('findAll', () => {
    it('should return all products for a company', async () => {
      const result = await service.findAll(mockCompanyId.toString());

      expect(result).toEqual([mockProduct]);
      expect(productModel.find).toHaveBeenCalledWith({
        companyId: mockCompanyId,
      });
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const result = await service.findOne(
        mockCompanyId.toString(),
        mockProductId.toString(),
      );

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException for invalid product ID', async () => {
      await expect(
        service.findOne(mockCompanyId.toString(), 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when product not found', async () => {
      productModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        service.findOne(mockCompanyId.toString(), mockProductId.toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product and invalidate cache', async () => {
      const updateDto = { price: 199.99 };

      const result = await service.update(
        mockCompanyId.toString(),
        mockProductId.toString(),
        updateDto,
      );

      expect(result).toEqual(mockProduct);
      expect(cacheInvalidationService.invalidateCompanyScript).toHaveBeenCalledWith(
        mockCompanyId.toString(),
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      productModel.findOneAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        service.update(mockCompanyId.toString(), mockProductId.toString(), {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a product and invalidate cache', async () => {
      await service.remove(mockCompanyId.toString(), mockProductId.toString());

      expect(companyModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockCompanyId.toString(),
        { $pull: { products: mockProductId } },
      );
      expect(cacheInvalidationService.invalidateCompanyScript).toHaveBeenCalledWith(
        mockCompanyId.toString(),
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      productModel.deleteOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ deletedCount: 0 }),
        }),
      });

      await expect(
        service.remove(mockCompanyId.toString(), mockProductId.toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

