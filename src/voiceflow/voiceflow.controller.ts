import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { VoiceflowService } from './voiceflow.service';
import { WebhookService } from './webhook.service';
import { VoiceflowScriptDto } from './dto/voiceflow-script.dto';
import {
  VoiceflowWebhookRequestDto,
} from './dto/webhook-request.dto';
import {
  VoiceflowWebhookResponseDto,
} from './dto/webhook-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../auth/guards/company-access.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@ApiTags('Voiceflow')
@Controller()
export class VoiceflowController {
  constructor(
    private readonly voiceflowService: VoiceflowService,
    private readonly webhookService: WebhookService,
  ) {}

  // Company-scoped script endpoints (require authentication)
  @Get('companies/:companyId/voiceflow/script')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, CompanyAccessGuard)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutes in milliseconds (5 * 60 * 1000)
  @ApiOperation({
    summary: 'Generate Voiceflow-compatible script from company data',
    description:
      'Aggregates company, products, projects, and offers into a Voiceflow-compatible JSON structure with variables and dynamic responses. Results are cached for 5 minutes.',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company ID',
    example: '607f1f77bcf86cd799439022',
  })
  @ApiResponse({
    status: 200,
    description: 'Voiceflow script generated successfully',
    type: VoiceflowScriptDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - No company access',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  async generateScript(
    @Param('companyId') companyId: string,
  ): Promise<VoiceflowScriptDto> {
    return await this.voiceflowService.generateScript(companyId);
  }

  @Get('companies/:companyId/voiceflow/preview')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, CompanyAccessGuard)
  @ApiOperation({
    summary: 'Preview Voiceflow script without caching',
    description:
      'Same as /script but bypasses cache - useful for testing updates',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Voiceflow script preview generated',
    type: VoiceflowScriptDto,
  })
  async previewScript(
    @Param('companyId') companyId: string,
  ): Promise<VoiceflowScriptDto> {
    return await this.voiceflowService.generateScript(companyId);
  }

  // Public webhook endpoint (no authentication required)
  @Post('voiceflow/webhook')
  @Public()
  @ApiOperation({
    summary: 'Voiceflow webhook for dynamic responses (PUBLIC)',
    description:
      'Handles Voiceflow webhook requests with NLP intent mapping. Returns dynamic data from database based on intent. No authentication required - use companyId in request body.',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
    type: VoiceflowWebhookResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid intent or parameters',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  async handleWebhook(
    @Body() request: VoiceflowWebhookRequestDto,
  ): Promise<VoiceflowWebhookResponseDto> {
    return await this.webhookService.handleWebhook(request);
  }
}

