import { IsString, IsOptional } from 'class-validator';

export class UpdateContractDto {
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

}