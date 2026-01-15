import { ApiProperty } from '@nestjs/swagger';
import { VoiceflowProductDto } from './voiceflow-product.dto';
import { VoiceflowProjectDto } from './voiceflow-project.dto';
import { VoiceflowOfferDto } from './voiceflow-offer.dto';

export class VoiceflowVariablesDto {
  @ApiProperty({ example: 'Excel Cargo' })
  company_name: string;

  @ApiProperty({ example: 'https://www.excelcargo.com' })
  company_website: string;

  @ApiProperty({ example: '+1234567890' })
  company_phone: string;

  @ApiProperty({ type: [VoiceflowProductDto] })
  products: VoiceflowProductDto[];

  @ApiProperty({ type: [VoiceflowProjectDto] })
  projects: VoiceflowProjectDto[];

  @ApiProperty({ type: [VoiceflowOfferDto] })
  offers: VoiceflowOfferDto[];

  @ApiProperty({ example: 3 })
  total_products: number;

  @ApiProperty({ example: 2 })
  total_projects: number;

  @ApiProperty({ example: 1 })
  total_offers: number;
}

export class VoiceflowScriptDto {
  @ApiProperty({ type: VoiceflowVariablesDto })
  variables: VoiceflowVariablesDto;

  @ApiProperty({
    type: [String],
    example: [
      'Welcome to {{company_name}}!',
      'Visit our website at {{company_website}}',
      'We currently offer {{products[0].name}} for ${{products[0].price}}',
      'Special offer: {{offers[0].title}} - {{offers[0].discount}}% off!',
    ],
  })
  responses: string[];

  @ApiProperty({ example: '2026-01-15T10:30:00Z' })
  generated_at: string;

  @ApiProperty({ example: '607f1f77bcf86cd799439022' })
  company_id: string;

  @ApiProperty({ example: 'v1' })
  version: string;
}

