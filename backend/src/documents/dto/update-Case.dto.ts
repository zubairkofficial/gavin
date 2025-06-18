import { IsString, IsOptional } from 'class-validator';

export class UpdateStatuteDto {
    @IsOptional()
  @IsString()
  title?: string;
  
    @IsOptional()
  @IsString()
  jurisdiction?: string;

  @IsOptional()
  @IsString()
  court?: string;

  @IsOptional()
  @IsString()
  decision_date?: string;

  @IsOptional()
  @IsString()
  citation?: string;

  @IsOptional()
  @IsString()
  holding_summary?: string;
  

}