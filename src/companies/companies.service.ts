import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company, CompanyDocument } from './schemas/company.schema';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    private readonly usersService: UsersService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    // Verify user exists
    await this.usersService.findOne(createCompanyDto.userId);

    const company = new this.companyModel({
      ...createCompanyDto,
      userId: new Types.ObjectId(createCompanyDto.userId),
    });
    return await company.save();
  }

  async findAll(): Promise<Company[]> {
    return await this.companyModel.find().populate('userId').exec();
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyModel.findById(id).populate('userId').exec();

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async findByUserId(userId: string): Promise<Company[]> {
    return await this.companyModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('userId')
      .exec();
  }

  async update(id: string, updateCompanyDto: any): Promise<Company> {
    await this.findOne(id);
    const company = await this.companyModel
      .findByIdAndUpdate(id, updateCompanyDto, { new: true })
      .populate('userId')
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


