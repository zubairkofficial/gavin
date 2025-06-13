import { IsString, IsNotEmpty, IsOptional, isNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}