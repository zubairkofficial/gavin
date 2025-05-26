import { Language } from '@/types';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserDTO {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiProperty({
    example: 'John Doe',
  })
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiProperty({
    example: 'John Doe',
  })
  firmName: string;
  
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiProperty({
    example: '1-10',
  })
  companySize: string;
}
