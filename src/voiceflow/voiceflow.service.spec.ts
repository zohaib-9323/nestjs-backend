import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { VoiceflowService } from './voiceflow.service';
import { Company } from '../companies/schemas/company.schema';
import { Product } from '../products/schemas/product.schema';
import { Project } from '../projects/schemas/project.schema';
import { Offer } from '../offers/schemas/offer.schema';
import { NotFoundException } from '@nestjs/common';

describe('VoiceflowService', () => {
  let service: VoiceflowService;
  let companyModel: any;
  let productModel: any;
  let projectModel: any;
  let offerModel: any;

  const mockCompanyId = new Types.ObjectId();
  const mockCompany = {
    _id: mockCompanyId,
    name: 'Test Company',
    websiteUrl: 'https://test.com',
    phoneNumber: '+1234567890',
  };

  const mockProducts = [
    {
      _id: new Types.ObjectId(),
      companyId: mockCompanyId,
      name: 'Product 1',
      description: 'Description 1',
      price: 100,
    },
    {
      _id: new Types.ObjectId(),
      companyId: mockCompanyId,
      name: 'Product 2',
      description: 'Description 2',
      price: 200,
    },
  ];

  const mockProjects = [
    {
      _id: new Types.ObjectId(),
      companyId: mockCompanyId,
      title: 'Project 1',
      goal: 'Goal 1',
    },
  ];

  const mockOffers = [
    {
      _id: new Types.ObjectId(),
      companyId: mockCompanyId,
      title: 'Offer 1',
      discount: 25,
    },
  ];

  beforeEach(async () => {
    const mockCompanyModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCompany),
      }),
    };

    const mockProductModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockProducts),
        }),
      }),
    };

    const mockProjectModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockProjects),
        }),
      }),
    };

    const mockOfferModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockOffers),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoiceflowService,
        {
          provide: getModelToken(Company.name),
          useValue: mockCompanyModel,
        },
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
        {
          provide: getModelToken(Project.name),
          useValue: mockProjectModel,
        },
        {
          provide: getModelToken(Offer.name),
          useValue: mockOfferModel,
        },
      ],
    }).compile();

    service = module.get<VoiceflowService>(VoiceflowService);
    companyModel = module.get(getModelToken(Company.name));
    productModel = module.get(getModelToken(Product.name));
    projectModel = module.get(getModelToken(Project.name));
    offerModel = module.get(getModelToken(Offer.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateScript', () => {
    it('should generate voiceflow script successfully', async () => {
      const result = await service.generateScript(mockCompanyId.toString());

      expect(result).toBeDefined();
      expect(result.variables).toBeDefined();
      expect(result.variables.company_name).toBe('Test Company');
      expect(result.variables.products).toHaveLength(2);
      expect(result.variables.projects).toHaveLength(1);
      expect(result.variables.offers).toHaveLength(1);
      expect(result.responses).toBeDefined();
      expect(result.responses.length).toBeGreaterThan(0);
      expect(result.company_id).toBe(mockCompanyId.toString());
      expect(result.version).toBe('v1');
    });

    it('should throw NotFoundException when company does not exist', async () => {
      companyModel.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.generateScript(mockCompanyId.toString()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for invalid company ID format', async () => {
      await expect(service.generateScript('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle company with no products/projects/offers', async () => {
      productModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      projectModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      offerModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.generateScript(mockCompanyId.toString());

      expect(result.variables.products).toHaveLength(0);
      expect(result.variables.projects).toHaveLength(0);
      expect(result.variables.offers).toHaveLength(0);
      expect(result.variables.total_products).toBe(0);
    });
  });

  describe('getCacheKey', () => {
    it('should generate correct cache key', () => {
      const companyId = '607f1f77bcf86cd799439022';
      const cacheKey = service.getCacheKey(companyId);

      expect(cacheKey).toBe(`voiceflow:script:${companyId}`);
    });
  });
});

