import { IsString, IsNotEmpty, IsOptional, isNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateMessageDto {
  @ApiProperty({
    description: 'The user message to send to AI',
    example: 'Hello, how are you?',
    type: String,
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Optional user ID to track conversations',
    example: 'user123',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Enable web search for this message',
    type: Boolean,
    default: false
  })
  @IsOptional()
  @IsString()
  websearch?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  isComplete?: string;

  @IsOptional()
  regenerate?: boolean;

  @IsOptional()
  @IsString()
  assistantMsgId?: string;
}