import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchDocumentsDto {
  @IsString()
  @ApiProperty({
    description: 'The text query to search for similar documents',
    example: 'Data privacy compliance requirements'
  })
  query: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 'user123'
  })
  userId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter by document type (e.g., regulation, contract, contract_clause)',
    example: 'regulation'
  })
  documentType?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter by jurisdiction',
    example: 'United States'
  })
  jurisdiction?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    example: 5,
    default: 5
  })
  limit?: number;
}
