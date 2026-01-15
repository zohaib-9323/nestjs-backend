import { ApiProperty } from '@nestjs/swagger';

/**
 * Voiceflow Webhook Response DTO
 * This is what we send back to Voiceflow
 */
export class VoiceflowWebhookResponseDto {
  @ApiProperty({
    example: true,
    description: 'Whether the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'get_products',
    description: 'The intent that was processed',
  })
  intent: string;

  @ApiProperty({
    example: {
      products: [
        { name: 'Premium Laptop', price: 999.99 },
        { name: 'Wireless Mouse', price: 29.99 },
      ],
      total: 2,
    },
    description: 'Dynamic data based on intent',
  })
  data: Record<string, any>;

  @ApiProperty({
    example: 'We found 2 products for you.',
    description: 'Human-readable response message',
  })
  message: string;

  @ApiProperty({
    example: '2026-01-15T10:30:00Z',
    description: 'Timestamp of the response',
  })
  timestamp: string;
}

