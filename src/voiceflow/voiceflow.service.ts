import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company, CompanyDocument } from '../companies/schemas/company.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Offer, OfferDocument } from '../offers/schemas/offer.schema';
import {
  VoiceflowScriptDto,
  VoiceflowVariablesDto,
} from './dto/voiceflow-script.dto';
import { VoiceflowProductDto } from './dto/voiceflow-product.dto';
import { VoiceflowProjectDto } from './dto/voiceflow-project.dto';
import { VoiceflowOfferDto } from './dto/voiceflow-offer.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class VoiceflowService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
  ) {}

  /**
   * Generate Voiceflow-compatible script from company data
   * This is the core mapper function that transforms DB data into Voiceflow format
   */
  async generateScript(companyId: string): Promise<VoiceflowScriptDto> {
    // Validate companyId format
    if (!Types.ObjectId.isValid(companyId)) {
      throw new NotFoundException('Invalid company ID format');
    }

    const companyObjectId = new Types.ObjectId(companyId);

    // 1️⃣ Fetch company data
    const company = await this.companyModel.findById(companyObjectId).lean();

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // 2️⃣ Fetch all related data in parallel for performance
    const [products, projects, offers] = await Promise.all([
      this.productModel
        .find({ companyId: companyObjectId })
        .sort({ createdAt: -1 })
        .lean(),
      this.projectModel
        .find({ companyId: companyObjectId })
        .sort({ createdAt: -1 })
        .lean(),
      this.offerModel
        .find({ companyId: companyObjectId })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // 3️⃣ Transform data using mapper function
    return this.mapCompanyToVoiceflow(
      company,
      products,
      projects,
      offers,
      companyId,
    );
  }

  /**
   * Core mapper function: Transforms company data into Voiceflow structure
   * This teaches data transformation and API contract design
   */
  private mapCompanyToVoiceflow(
    company: Company,
    products: Product[],
    projects: Project[],
    offers: Offer[],
    companyId: string,
  ): VoiceflowScriptDto {
    // Transform products
    const voiceflowProducts = plainToInstance(
      VoiceflowProductDto,
      products.map((p) => ({
        name: p.name,
        description: p.description,
        price: p.price,
      })),
      { excludeExtraneousValues: true },
    );

    // Transform projects
    const voiceflowProjects = plainToInstance(
      VoiceflowProjectDto,
      projects.map((p) => ({
        title: p.title,
        goal: p.goal,
      })),
      { excludeExtraneousValues: true },
    );

    // Transform offers
    const voiceflowOffers = plainToInstance(
      VoiceflowOfferDto,
      offers.map((o) => ({
        title: o.title,
        discount: o.discount,
      })),
      { excludeExtraneousValues: true },
    );

    // Build variables object
    const variables: VoiceflowVariablesDto = {
      company_name: company.name,
      company_website: company.websiteUrl,
      company_phone: company.phoneNumber,
      products: voiceflowProducts,
      projects: voiceflowProjects,
      offers: voiceflowOffers,
      total_products: products.length,
      total_projects: projects.length,
      total_offers: offers.length,
    };

    // Generate dynamic responses based on available data
    const responses = this.generateResponses(
      company,
      products,
      projects,
      offers,
    );

    // Build final Voiceflow script
    const script: VoiceflowScriptDto = {
      variables,
      responses,
      generated_at: new Date().toISOString(),
      company_id: companyId,
      version: 'v1',
    };

    return script;
  }

  /**
   * Generate dynamic responses based on available data
   * Uses Voiceflow variable interpolation syntax: {{variable_name}}
   */
  private generateResponses(
    company: Company,
    products: Product[],
    projects: Project[],
    offers: Offer[],
  ): string[] {
    const responses: string[] = [];

    // Welcome message
    responses.push(
      `Welcome to {{company_name}}! How can I assist you today?`,
    );

    // Company information
    responses.push(
      `You can reach us at {{company_phone}} or visit our website at {{company_website}}.`,
    );

    // Products responses
    if (products.length > 0) {
      responses.push(
        `We currently have {{total_products}} product${products.length > 1 ? 's' : ''} available.`,
      );

      // Highlight first product
      responses.push(
        'Our featured product is {{products[0].name}} - {{products[0].description}}. It is priced at ${{products[0].price}}.',
      );

      // If multiple products
      if (products.length > 1) {
        responses.push(
          'We also offer {{products[1].name}} for ${{products[1].price}}.',
        );
      }

      // Product inquiry
      responses.push(
        `Would you like to know more about any of our products?`,
      );
    } else {
      responses.push(
        `We're currently updating our product catalog. Please check back soon!`,
      );
    }

    // Projects responses
    if (projects.length > 0) {
      responses.push(
        `We're working on {{total_projects}} exciting project${projects.length > 1 ? 's' : ''}.`,
      );

      responses.push(
        `Our current project is {{projects[0].title}} with the goal: {{projects[0].goal}}.`,
      );
    }

    // Offers responses
    if (offers.length > 0) {
      responses.push(
        `Great news! We have {{total_offers}} special offer${offers.length > 1 ? 's' : ''} for you!`,
      );

      responses.push(
        `Check out our {{offers[0].title}} - Save {{offers[0].discount}}% on select items!`,
      );

      // If multiple offers
      if (offers.length > 1) {
        responses.push(
          `We also have {{offers[1].title}} with {{offers[1].discount}}% off!`,
        );
      }

      responses.push(`Don't miss out on these limited-time deals!`);
    }

    // Closing
    responses.push(
      `Is there anything specific I can help you with regarding {{company_name}}?`,
    );

    return responses;
  }

  /**
   * Get cache key for a company's Voiceflow script
   * Used for Redis caching
   */
  getCacheKey(companyId: string): string {
    return `voiceflow:script:${companyId}`;
  }
}

