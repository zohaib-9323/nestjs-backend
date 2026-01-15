import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Voiceflow Webhook Request DTO
 * This represents the payload Voiceflow sends to our webhook
 */
export class VoiceflowWebhookRequestDto {
  @ApiProperty({
    example: 'get_products',
    description: 'Intent/action requested by Voiceflow',
  })
  @IsString()
  @IsNotEmpty()
  intent: string;

  @ApiProperty({
    example: '607f1f77bcf86cd799439022',
    description: 'Company ID from Voiceflow context',
  })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({
    example: { category: 'electronics', limit: 5 },
    description: 'Additional parameters from Voiceflow',
    required: false,
  })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;

  @ApiProperty({
    example: 'user123',
    description: 'User ID from Voiceflow session',
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;
}

