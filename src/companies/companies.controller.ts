import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
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

@ApiTags('companies')
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles(Role.USER, Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({
    status: 201,
    description: 'Company successfully created',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser() user: any,
  ): Promise<CompanyResponseDto> {
    // If user is not admin/superadmin, they can only create companies for themselves
    if (user.role === Role.USER) {
      createCompanyDto.userId = user.userId;
    }
    const company = await this.companiesService.create(createCompanyDto);
    const { _id, userId, ...rest } = company;
    return {
      id: _id.toString(),
      userId: typeof userId === 'object' ? userId.toString() : userId,
      ...rest,
    } as CompanyResponseDto;
  }

  @Get()
  @Roles(Role.USER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get all companies or filter by user ID' })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filter companies by user ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of companies',
    type: [CompanyResponseDto],
  })
  async findAll(
    @Query('userId') userId?: string,
    @CurrentUser() user?: any,
  ): Promise<CompanyResponseDto[]> {
    let companies;
    // Regular users can only see their own companies
    if (user.role === Role.USER) {
      companies = await this.companiesService.findByUserId(user.userId);
    } else if (userId) {
      companies = await this.companiesService.findByUserId(userId);
    } else {
      companies = await this.companiesService.findAll();
    }
    return companies.map((company) => {
      const { _id, userId, ...rest } = company;
      return {
        id: _id.toString(),
        userId: typeof userId === 'object' ? userId.toString() : userId,
        ...rest,
      } as CompanyResponseDto;
    });
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
    @CurrentUser() user?: any,
  ): Promise<CompanyResponseDto> {
    const company = await this.companiesService.findOne(id);
    // Regular users can only access their own companies
    if (
      user.role === Role.USER &&
      company.userId.toString() !== user.userId
    ) {
      throw new ForbiddenException('You can only access your own companies');
    }
    const { _id, userId, ...rest } = company;
    return {
      id: _id.toString(),
      userId: typeof userId === 'object' ? userId.toString() : userId,
      ...rest,
    } as CompanyResponseDto;
  }

  @Put(':id')
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
    @CurrentUser() user?: any,
  ): Promise<CompanyResponseDto> {
    const company = await this.companiesService.findOne(id);
    // Regular users can only update their own companies
    if (
      user.role === Role.USER &&
      company.userId.toString() !== user.userId
    ) {
      throw new ForbiddenException('You can only update your own companies');
    }
    const updatedCompany = await this.companiesService.update(
      id,
      updateCompanyDto,
    );
    const { _id, userId, ...rest } = updatedCompany;
    return {
      id: _id.toString(),
      userId: typeof userId === 'object' ? userId.toString() : userId,
      ...rest,
    } as CompanyResponseDto;
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


