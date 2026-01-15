import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company, CompanyDocument } from '../companies/schemas/company.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Offer, OfferDocument } from '../offers/schemas/offer.schema';
import {
  VoiceflowWebhookRequestDto,
} from './dto/webhook-request.dto';
import {
  VoiceflowWebhookResponseDto,
} from './dto/webhook-response.dto';

/**
 * Webhook Service for Voiceflow Integration
 * Handles NLP intent mapping and dynamic response generation
 */
@Injectable()
export class WebhookService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
  ) {}

  /**
   * Main webhook handler - routes to specific intent handlers
   */
  async handleWebhook(
    request: VoiceflowWebhookRequestDto,
  ): Promise<VoiceflowWebhookResponseDto> {
    const { intent, companyId, parameters } = request;

    // Validate company exists
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID format');
    }

    const company = await this.companyModel.findById(companyId).lean();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Intent mapping - route to appropriate handler
    let data: Record<string, any>;
    let message: string;

    switch (intent.toLowerCase()) {
      case 'get_products':
      case 'list_products':
      case 'show_products':
        ({ data, message } = await this.handleGetProducts(companyId, parameters));
        break;

      case 'get_product_details':
      case 'product_info':
        ({ data, message } = await this.handleGetProductDetails(companyId, parameters));
        break;

      case 'get_projects':
      case 'list_projects':
        ({ data, message } = await this.handleGetProjects(companyId, parameters));
        break;

      case 'get_offers':
      case 'list_offers':
      case 'show_deals':
        ({ data, message } = await this.handleGetOffers(companyId, parameters));
        break;

      case 'get_company_info':
      case 'company_details':
        ({ data, message } = await this.handleGetCompanyInfo(company));
        break;

      case 'search_products':
        ({ data, message } = await this.handleSearchProducts(companyId, parameters));
        break;

      default:
        throw new BadRequestException(`Unknown intent: ${intent}`);
    }

    return {
      success: true,
      intent,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle "get_products" intent
   */
  private async handleGetProducts(
    companyId: string,
    parameters?: Record<string, any>,
  ): Promise<{ data: Record<string, any>; message: string }> {
    const limit = parameters?.limit || 10;

    const products = await this.productModel
      .find({ companyId: new Types.ObjectId(companyId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const data = {
      products: products.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        price: p.price,
      })),
      total: products.length,
      limit,
    };

    const message =
      products.length > 0
        ? `I found ${products.length} product${products.length > 1 ? 's' : ''} for you. ${products[0].name} is priced at $${products[0].price}.`
        : "We don't have any products available right now. Please check back soon!";

    return { data, message };
  }

  /**
   * Handle "get_product_details" intent
   */
  private async handleGetProductDetails(
    companyId: string,
    parameters?: Record<string, any>,
  ): Promise<{ data: Record<string, any>; message: string }> {
    const productName = parameters?.productName || parameters?.name;

    if (!productName) {
      throw new BadRequestException('Product name is required');
    }

    // Search by name (case-insensitive)
    const product = await this.productModel
      .findOne({
        companyId: new Types.ObjectId(companyId),
        name: new RegExp(productName, 'i'),
      })
      .lean();

    if (!product) {
      return {
        data: { found: false },
        message: `Sorry, I couldn't find a product called "${productName}".`,
      };
    }

    const data = {
      found: true,
      product: {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
      },
    };

    const message = `${product.name} - ${product.description}. It's priced at $${product.price}.`;

    return { data, message };
  }

  /**
   * Handle "get_projects" intent
   */
  private async handleGetProjects(
    companyId: string,
    parameters?: Record<string, any>,
  ): Promise<{ data: Record<string, any>; message: string }> {
    const limit = parameters?.limit || 10;

    const projects = await this.projectModel
      .find({ companyId: new Types.ObjectId(companyId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const data = {
      projects: projects.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        goal: p.goal,
      })),
      total: projects.length,
    };

    const message =
      projects.length > 0
        ? `We're currently working on ${projects.length} project${projects.length > 1 ? 's' : ''}. Our main focus is ${projects[0].title}.`
        : "We don't have any active projects at the moment.";

    return { data, message };
  }

  /**
   * Handle "get_offers" intent
   */
  private async handleGetOffers(
    companyId: string,
    parameters?: Record<string, any>,
  ): Promise<{ data: Record<string, any>; message: string }> {
    const offers = await this.offerModel
      .find({ companyId: new Types.ObjectId(companyId) })
      .sort({ discount: -1 }) // Best deals first
      .lean();

    const data = {
      offers: offers.map((o) => ({
        id: o._id.toString(),
        title: o.title,
        discount: o.discount,
      })),
      total: offers.length,
    };

    const message =
      offers.length > 0
        ? `Great news! We have ${offers.length} special offer${offers.length > 1 ? 's' : ''} available. ${offers[0].title} gives you ${offers[0].discount}% off!`
        : "We don't have any special offers right now, but check back soon for great deals!";

    return { data, message };
  }

  /**
   * Handle "get_company_info" intent
   */
  private async handleGetCompanyInfo(
    company: Company,
  ): Promise<{ data: Record<string, any>; message: string }> {
    const data = {
      company: {
        name: company.name,
        website: company.websiteUrl,
        phone: company.phoneNumber,
      },
    };

    const message = `We are ${company.name}. You can visit us at ${company.websiteUrl} or call us at ${company.phoneNumber}.`;

    return { data, message };
  }

  /**
   * Handle "search_products" intent
   */
  private async handleSearchProducts(
    companyId: string,
    parameters?: Record<string, any>,
  ): Promise<{ data: Record<string, any>; message: string }> {
    const query = parameters?.query || parameters?.search;

    if (!query) {
      throw new BadRequestException('Search query is required');
    }

    // Search by name or description
    const products = await this.productModel
      .find({
        companyId: new Types.ObjectId(companyId),
        $or: [
          { name: new RegExp(query, 'i') },
          { description: new RegExp(query, 'i') },
        ],
      })
      .limit(5)
      .lean();

    const data = {
      query,
      products: products.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        price: p.price,
      })),
      total: products.length,
    };

    const message =
      products.length > 0
        ? `I found ${products.length} product${products.length > 1 ? 's' : ''} matching "${query}".`
        : `Sorry, I couldn't find any products matching "${query}".`;

    return { data, message };
  }
}

