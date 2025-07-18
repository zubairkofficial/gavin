import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDocumentDto {

    @IsOptional()
    @IsString()
    title: string; 

    @IsOptional()
    @IsString()
    fileName: string; 

    @IsOptional()
    @IsString()
    url: string; 

     @IsOptional()
    @IsString()
    filePath: string;

    @IsOptional()
      @IsNotEmpty()
    @IsString()
    @Transform(({ value }) => value.toLowerCase())
    type: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    userId?: string;

    // Fields for regulation
    @IsOptional()
    @IsString()
    jurisdiction?: string;

    @IsOptional()
    @IsArray()
    categories?: string;

    @IsOptional()
    @IsString()
    citation?: string;

    @IsOptional()
    @IsString()
    section?: string;

    @IsOptional()
    @IsString()
    subject_area?: string;

    @IsOptional()
    @IsString()
    summary?: string;

    @IsOptional()
    @IsString()
    source_url?: string;

    // Fields for contract
    @IsOptional()
    @IsString()
    version_label?: string;

    @IsOptional()
    @IsString()
    source?: string;

}
