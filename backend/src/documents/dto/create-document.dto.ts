import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateDocumentDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsString()
    type: string;

    @IsOptional()
    @IsString()
    content?: string;

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
