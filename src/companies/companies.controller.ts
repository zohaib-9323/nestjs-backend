import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { plainToInstance } from 'class-transformer';

@ApiTags('Companies')
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles(Role.USER, Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new company',
    description: 'Creates a new company and associates it with the specified user ID. The userId must be provided in the request body.'
  })
  @ApiResponse({
    status: 201,
    description: 'Company successfully created',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid user ID' })
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser() user: any,
  ): Promise<CompanyResponseDto> {
    console.log('[CompaniesController] Create company request:', {
      requestedUserId: createCompanyDto.userId,
      authenticatedUser: user.userId,
      userRole: user.role,
      companyData: createCompanyDto,
    });
    
    // Use userId from request body (not from JWT)
    const company = await this.companiesService.create(
      createCompanyDto,
      createCompanyDto.userId,
    );
    
    return plainToInstance(CompanyResponseDto, company, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @Roles(Role.USER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ 
    summary: 'Get companies created by the authenticated user',
    description: 'Returns all companies where the authenticated user is the owner/creator. SuperAdmin can see all companies.'
  })
  @ApiResponse({
    status: 200,
    description: 'List of companies created by the user',
    type: [CompanyResponseDto],
  })
  async findAll(@CurrentUser() user: any): Promise<CompanyResponseDto[]> {
    console.log('[CompaniesController] Fetching companies for user:', user.userId);
    
    let companies;

    if (user.role === Role.SUPERADMIN) {
      // SuperAdmin can see all companies
      companies = await this.companiesService.findAll();
    } else {
      // Regular users and admins see only companies they created (where they are owner)
      companies = await this.companiesService.findUserCompanies(user.userId);
    }

    console.log('[CompaniesController] Found companies:', companies.length);

    return companies.map((company) =>
      plainToInstance(CompanyResponseDto, company, {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Get(':id')
  @Roles(Role.USER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Company found',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<CompanyResponseDto> {
    const company = await this.companiesService.findOne(id);

    // Check if user has access
    if (user.role !== Role.SUPERADMIN) {
      const isOwner = company.ownerId.toString() === user.userId;
      const isMember = company.members?.some(
        (memberId) => memberId.toString() === user.userId,
      );

      if (!isOwner && !isMember) {
        throw new ForbiddenException('You do not have access to this company');
      }
    }

    return plainToInstance(CompanyResponseDto, company, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @Roles(Role.USER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Update company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Company updated successfully',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() user: any,
  ): Promise<CompanyResponseDto> {
    const company = await this.companiesService.findOne(id);

    // Only owner and superadmin can update
    if (
      user.role !== Role.SUPERADMIN &&
      company.ownerId.toString() !== user.userId
    ) {
      throw new ForbiddenException(
        'Only the company owner can update company details',
      );
    }

    const updatedCompany = await this.companiesService.update(
      id,
      updateCompanyDto,
    );
    return plainToInstance(CompanyResponseDto, updatedCompany, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':id/members/:userId')
  @Roles(Role.USER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Add a member to the company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiParam({ name: 'userId', description: 'User ID to add as member' })
  @ApiResponse({
    status: 200,
    description: 'Member added successfully',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Company or User not found' })
  async addMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ): Promise<CompanyResponseDto> {
    const company = await this.companiesService.findOne(id);

    // Only owner and superadmin can add members
    if (
      user.role !== Role.SUPERADMIN &&
      company.ownerId.toString() !== user.userId
    ) {
      throw new ForbiddenException('Only the company owner can add members');
    }

    const updatedCompany = await this.companiesService.addMember(id, userId);
    return plainToInstance(CompanyResponseDto, updatedCompany, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id/members/:userId')
  @Roles(Role.USER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Remove a member from the company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove from members' })
  @ApiResponse({
    status: 200,
    description: 'Member removed successfully',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Company or User not found' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ): Promise<CompanyResponseDto> {
    const company = await this.companiesService.findOne(id);

    // Only owner and superadmin can remove members
    if (
      user.role !== Role.SUPERADMIN &&
      company.ownerId.toString() !== user.userId
    ) {
      throw new ForbiddenException('Only the company owner can remove members');
    }

    const updatedCompany = await this.companiesService.removeMember(id, userId);
    return plainToInstance(CompanyResponseDto, updatedCompany, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete company (Admin/Superadmin only)',
  })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({
    status: 204,
    description: 'Company deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.companiesService.delete(id);
  }
}


