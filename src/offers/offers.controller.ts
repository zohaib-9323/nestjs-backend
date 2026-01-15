import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OfferResponseDto } from './dto/offer-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../auth/guards/company-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

@ApiTags('Offers')
@ApiBearerAuth('JWT-auth')
@Controller('companies/:companyId/offers')
@UseGuards(JwtAuthGuard, CompanyAccessGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new offer for a company' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({
    status: 201,
    description: 'Offer created successfully',
    type: OfferResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - No company access' })
  async create(
    @Param('companyId') companyId: string,
    @Body() createOfferDto: CreateOfferDto,
  ): Promise<OfferResponseDto> {
    const offer = await this.offersService.create(companyId, createOfferDto);
    return plainToInstance(OfferResponseDto, offer, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all offers for a company' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Offers retrieved successfully',
    type: [OfferResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - No company access' })
  async findAll(
    @Param('companyId') companyId: string,
  ): Promise<OfferResponseDto[]> {
    const offers = await this.offersService.findAll(companyId);
    return plainToInstance(OfferResponseDto, offers, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific offer by ID' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiParam({ name: 'id', description: 'Offer ID' })
  @ApiResponse({
    status: 200,
    description: 'Offer retrieved successfully',
    type: OfferResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No company access' })
  async findOne(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ): Promise<OfferResponseDto> {
    const offer = await this.offersService.findOne(companyId, id);
    return plainToInstance(OfferResponseDto, offer, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an offer' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiParam({ name: 'id', description: 'Offer ID' })
  @ApiResponse({
    status: 200,
    description: 'Offer updated successfully',
    type: OfferResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No company access' })
  async update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() updateOfferDto: UpdateOfferDto,
  ): Promise<OfferResponseDto> {
    const offer = await this.offersService.update(companyId, id, updateOfferDto);
    return plainToInstance(OfferResponseDto, offer, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete an offer (Superadmin only)',
    description: 'Only superadmin role can delete offers',
  })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiParam({ name: 'id', description: 'Offer ID' })
  @ApiResponse({ status: 204, description: 'Offer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin role required' })
  async remove(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.offersService.remove(companyId, id);
  }
}

