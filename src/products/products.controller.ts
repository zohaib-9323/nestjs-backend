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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../auth/guards/company-access.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('companies/:companyId/products')
@UseGuards(JwtAuthGuard, CompanyAccessGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product for a company' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - No company access' })
  async create(
    @Param('companyId') companyId: string,
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.create(
      companyId,
      createProductDto,
    );
    return plainToInstance(ProductResponseDto, product, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all products for a company' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    type: [ProductResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - No company access' })
  async findAll(
    @Param('companyId') companyId: string,
  ): Promise<ProductResponseDto[]> {
    const products = await this.productsService.findAll(companyId);
    return plainToInstance(ProductResponseDto, products, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific product by ID' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No company access' })
  async findOne(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.findOne(companyId, id);
    return plainToInstance(ProductResponseDto, product, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No company access' })
  async update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.update(
      companyId,
      id,
      updateProductDto,
    );
    return plainToInstance(ProductResponseDto, product, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 204, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No company access' })
  async remove(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.productsService.remove(companyId, id);
  }
}

