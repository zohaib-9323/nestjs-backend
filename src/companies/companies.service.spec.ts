import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { Company } from './schemas/company.schema';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UsersService } from '../users/users.service';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let model: Model<Company>;
  let usersService: UsersService;

  const mockCompanyInstance = {
    save: jest.fn(),
  };

  const mockModel = jest.fn().mockImplementation(() => mockCompanyInstance);
  mockModel.find = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  });
  mockModel.findById = jest.fn();

  const mockUsersService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        {
          provide: getModelToken(Company.name),
          useValue: mockModel,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    model = module.get<Model<Company>>(getModelToken(Company.name));
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createCompanyDto: CreateCompanyDto = {
      name: 'Acme Corp',
      websiteUrl: 'https://acme.com',
      phoneNumber: '+1234567890',
      userId: '507f1f77bcf86cd799439011',
    };

    it('should create a new company', async () => {
      const user = { _id: '507f1f77bcf86cd799439011', email: 'test@example.com' };
      mockUsersService.findOne.mockResolvedValue(user);
      
      mockCompanyInstance.save.mockResolvedValue({
        _id: '507f1f77bcf86cd799439012',
        ...createCompanyDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      mockModel.mockReturnValue(mockCompanyInstance);

      const result = await service.create(createCompanyDto);

      expect(result).toBeDefined();
      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        createCompanyDto.userId,
      );
      expect(mockModel).toHaveBeenCalled();
      expect(mockCompanyInstance.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUsersService.findOne.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(service.create(createCompanyDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a company by id', async () => {
      const company = {
        _id: '507f1f77bcf86cd799439012',
        name: 'Acme Corp',
        websiteUrl: 'https://acme.com',
        phoneNumber: '+1234567890',
      };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(company),
      };
      mockModel.findById.mockReturnValue(mockQuery);

      const result = await service.findOne('507f1f77bcf86cd799439012');

      expect(result).toEqual(company);
      expect(mockModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    });

    it('should throw NotFoundException if company not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      mockModel.findById.mockReturnValue(mockQuery);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
