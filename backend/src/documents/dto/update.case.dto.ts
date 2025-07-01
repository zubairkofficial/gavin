import { IsString, IsOptional } from 'class-validator';

export class UpdateCaseDto {
    @IsOptional()
  @IsString()
  type?: string;

    @IsOptional()
  @IsString()
  title?: string;
  
    @IsOptional()
  @IsString()
  jurisdiction?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  case_type?: string;




}