import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company, CompanyDocument } from '../../companies/schemas/company.schema';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class CompanyAccessGuard implements CanActivate {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // SuperAdmin can access everything
    if (user.role === Role.SUPERADMIN) {
      return true;
    }

    // Get companyId from route params
    const companyId = request.params.companyId;

    if (!companyId) {
      throw new ForbiddenException('Company ID not provided');
    }

    // Validate companyId format
    if (!Types.ObjectId.isValid(companyId)) {
      throw new ForbiddenException('Invalid company ID format');
    }

    // Check if company exists
    const company = await this.companyModel.findById(companyId).lean();

    if (!company) {
      throw new ForbiddenException('Company not found');
    }

    // Check if user is the owner
    if (company.ownerId.toString() === user.userId) {
      return true;
    }

    // Check if user is a member of the company
    const isMember = company.members?.some(
      (memberId) => memberId.toString() === user.userId,
    );

    if (isMember) {
      return true;
    }

    throw new ForbiddenException(
      'Access denied: You do not have permission to access this company',
    );
  }
}

