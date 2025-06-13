import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Hello, how are you?' })
  userMessage: string;

  @ApiProperty({ example: "Hello! I'm doing well, thank you for asking..." })
  aiResponse: string;

  @ApiPropertyOptional({ example: 'user123' })
  userId?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}

export class ChatResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: MessageResponseDto })
  data: MessageResponseDto;

  @ApiPropertyOptional({
    example: {
      prompt_tokens: 20,
      completion_tokens: 15,
      total_tokens: 35,
    },
  })
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class MessagesListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [MessageResponseDto] })
  data: MessageResponseDto[];

  @ApiProperty({
    example: {
      limit: 50,
      offset: 0,
      total: 100,
    },
  })
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export class HealthCheckResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Chat service is healthy' })
  message: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({
    example: {
      database: 'connected',
      openai: 'configured',
    },
  })
  services: {
    database: string;
    openai: string;
  };
}