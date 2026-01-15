import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company, CompanyDocument } from './schemas/company.schema';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UsersService } from '../users/users.service';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly usersService: UsersService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, userId: string): Promise<Company> {
    // Verify user exists
    const user = await this.usersService.findOne(userId);
    
    console.log('[CompaniesService] Creating company for user:', {
      userId: userId,
      userEmail: user.email,
      companyName: createCompanyDto.name,
    });

    // Remove userId from DTO before saving
    const { userId: _, ...companyData } = createCompanyDto;

    const company = new this.companyModel({
      ...companyData,
      ownerId: new Types.ObjectId(userId),
    });
    
    const savedCompany = await company.save();
    
    console.log('[CompaniesService] Company created successfully:', {
      companyId: savedCompany._id.toString(),
      ownerId: savedCompany.ownerId.toString(),
      createdForUserId: userId,
    });

    // Add company to user's companies array
    await this.userModel.findByIdAndUpdate(userId, {
      $addToSet: { companies: savedCompany._id },
    });
    
    console.log('[CompaniesService] User companies array updated');

    return savedCompany;
  }

  async findAll(): Promise<Company[]> {
    return await this.companyModel
      .find()
      .populate('ownerId', 'email firstName lastName')
      .exec();
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyModel
      .findById(id)
      .populate('ownerId', 'email firstName lastName')
      .populate('members', 'email firstName lastName')
      .exec();

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async findByOwnerId(ownerId: string): Promise<Company[]> {
    return await this.companyModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .populate('ownerId', 'email firstName lastName')
      .exec();
  }

  async findUserCompanies(userId: string): Promise<Company[]> {
    // Find companies where user is the owner (creator)
    console.log('[CompaniesService] Finding companies for user:', userId);
    
    const companies = await this.companyModel
      .find({ ownerId: new Types.ObjectId(userId) })
      .populate('ownerId', 'email firstName lastName')
      .exec();
    
    console.log('[CompaniesService] Found companies:', companies.length);
    
    return companies;
  }

  async addMember(companyId: string, userId: string): Promise<Company> {
    // Verify user exists
    await this.usersService.findOne(userId);

    const company = await this.companyModel
      .findByIdAndUpdate(
        companyId,
        { $addToSet: { members: new Types.ObjectId(userId) } },
        { new: true },
      )
      .populate('ownerId', 'email firstName lastName')
      .populate('members', 'email firstName lastName')
      .exec();

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Add company to user's companies array
    await this.userModel.findByIdAndUpdate(userId, {
      $addToSet: { companies: companyId },
    });

    return company;
  }

  async removeMember(companyId: string, userId: string): Promise<Company> {
    const company = await this.companyModel
      .findByIdAndUpdate(
        companyId,
        { $pull: { members: new Types.ObjectId(userId) } },
        { new: true },
      )
      .populate('ownerId', 'email firstName lastName')
      .populate('members', 'email firstName lastName')
      .exec();

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Remove company from user's companies array
    await this.userModel.findByIdAndUpdate(userId, {
      $pull: { companies: new Types.ObjectId(companyId) },
    });

    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
    await this.findOne(id);
    const company = await this.companyModel
      .findByIdAndUpdate(id, updateCompanyDto, { new: true })
      .populate('ownerId', 'email firstName lastName')
      .exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async delete(id: string): Promise<void> {
    await this.companyModel.findByIdAndDelete(id).exec();
  }
}


