import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let model: Model<User>;

  const mockUserInstance = {
    save: jest.fn(),
  };

  const mockModel = jest.fn().mockImplementation(() => mockUserInstance);
  mockModel.findOne = jest.fn();
  mockModel.findById = jest.fn();
  mockModel.create = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<User>>(getModelToken(User.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should create a new user', async () => {
      mockModel.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      
      mockUserInstance.save.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        ...createUserDto,
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      mockModel.mockReturnValue(mockUserInstance);

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(mockModel.findOne).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockModel).toHaveBeenCalled();
      expect(mockUserInstance.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      mockModel.findOne.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        email: createUserDto.email,
      });

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(user);
      expect(mockModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
