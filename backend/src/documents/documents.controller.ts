import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Get,
  Param,
  Put,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { z } from 'zod';
import { Contract } from './entities/contract.entity';
import { Clause } from './entities/clause.entity';
import { Regulation } from './entities/regulation.entity';
import { OpenAIService } from '../services/openai.service';
import { ContractSchema, ClauseSchema } from './schemas/contract.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Public } from '../auth/decorators/public.decorator';
import { DocumentsService } from './documents.service';
import { GeminiServiceRegulation } from '../services/gemini.regulation.service';
import { OpenAIServiceRegulation } from '@/services/openai.regulations.service';
import { UpdateContractDto } from './dto/update-contract.dto';
import { UpdateRegulationDto } from './dto/update-regulation.dto';

@Controller('/documents')

@Public()
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    @InjectRepository(Regulation)
    private regulationRepository: Repository<Regulation>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Clause)
    private clauseRepository: Repository<Clause>,
    private OpenAIService: OpenAIService,
    private GeminiServiceRegulation: GeminiServiceRegulation,
    private OpenServiceRegulation: OpenAIServiceRegulation,
  ) {}

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const supportedTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!supportedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Supported types are: text, pdf, and doc/docx`,
      );
    }

    const tempFilePath = `temp_${Date.now()}_${file.originalname}`;
    try {
      await fs.promises.writeFile(tempFilePath, file.buffer);

      let fullText = '';
      if (file.mimetype === 'text/plain') {
        fullText = await fs.promises.readFile(tempFilePath, 'utf8');
      } else {
        const parsedText = await this.documentsService.parseDocument(
          tempFilePath,
          file.mimetype,
        );
        fullText = parsedText;
      }

    
      if (!fullText || typeof fullText !== 'string') {
        throw new BadRequestException(
          'Document parsing failed: empty or invalid content',
        );
      }

      // Remove any null bytes or invalid characters and validate length
      fullText = fullText.replace(/\0/g, '').trim();

      if (!fullText) {
        throw new BadRequestException('Could not extract text from document');
      }

      
      if (fullText.length < 10) {
        throw new BadRequestException(
          'Document content too short or incomplete',
        );
      }

      // Log parsing results for debugging
      console.log('Parsed document length:', fullText.length);
      console.log('First 100 characters:', fullText.substring(0, 100));

      // Enhanced text sanitization
      fullText = fullText
        // Remove control characters and non-printable characters
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')

        // Replace smart quotes with straight quotes
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')

        // Replace various dash types with standard dash
        .replace(/[\u2013\u2014\u2015]/g, '-')

        // Replace multiple spaces with single space
        .replace(/\s+/g, ' ')

        // Replace multiple line breaks with single line break
        .replace(/(\r\n|\n|\r){2,}/g, '\n')

        // Remove zero-width spaces and joiners
        .replace(/[\u200B-\u200D\uFEFF]/g, '')

        // Handle special whitespace characters
        .replace(/[\u00A0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]/g, ' ')

        // Remove HTML/XML tags if present
        .replace(/<[^>]*>/g, ' ')

        // Handle common Unicode alternatives
        .replace(/[\u2022\u2023\u25E6\u2043]/g, '*') // Convert bullets to asterisks
        .replace(/[\u2010\u2011]/g, '-') // normalize hyphens

        // Clean up whitespace
        .replace(/^\s+|\s+$/gm, '') // trim each line
        .replace(/\n\s*\n/g, '\n') // remove multiple blank lines

        // Final trim and normalization
        .trim()
        .normalize('NFKC'); // Normalize Unicode characters

      // Add validation for suspicious patterns
      const suspiciousPatterns = [
        /\u0000/g, // Null bytes
        /[\uD800-\uDFFF]/g, // Surrogate pairs
        /\u{FFFD}/gu, // Replacement character
      ];

      const hasSuspiciousContent = suspiciousPatterns.some((pattern) =>
        pattern.test(fullText),
      );

      if (hasSuspiciousContent) {
        console.warn(
          'Warning: Document contains suspicious character patterns',
        );
      }

      // Validate final text length
      if (fullText.length > 100000) {
        console.warn(
          `Document length (${fullText.length}) exceeds limit, truncating...`,
        );
        fullText = fullText.substring(0, 100000);
      }

      switch (createDocumentDto.type?.toLowerCase()) {
        case 'statute/regulation':
          return this.handleRegulation(createDocumentDto, fullText);

        case 'contract template':
          return this.handleContract(createDocumentDto, fullText);

        default:
          throw new BadRequestException('Document type not recognized');
      }
    } catch (error) {
      this.handleError(error, tempFilePath);
    } finally {
      this.cleanupTempFile(tempFilePath);
    }
  }

  private async handleRegulation(dto: CreateDocumentDto, fullText: string) {
    try {
      const analysisResults = await this.OpenServiceRegulation.analyzeRegulations(fullText);

      if (!analysisResults || !analysisResults[0]) {
        throw new BadRequestException('Failed to analyze regulation content');
      }
      const analysis = analysisResults[0];
      const regulation = new Regulation();
      regulation.full_text = fullText; // Store original full text
      regulation.title = dto.title || analysis.title;
      regulation.jurisdiction = analysis.jurisdiction || dto.jurisdiction || 'Unknown';
      regulation.citation = analysis.citation || dto.citation || '';
      regulation.section = analysis.section || dto.section || '';
      regulation.subject_area = analysis.subject_area || dto.subject_area || '';
      regulation.summary = analysis.summary || dto.summary || '';
      regulation.source_url = dto.source_url || '';
      regulation.updated_at = new Date().toISOString();

      // Save to database
      const savedRegulation = await this.regulationRepository.save(regulation);

      return {
        success: true,
        data: savedRegulation,
        message: 'Regulation processed and saved successfully'
      };

    } catch (error) {
      throw new BadRequestException(
        `Failed to process regulation: ${error.message}`,
      );
    }
  }

  private async handleContract(dto: CreateDocumentDto, fullText: string) {
    try {
    
      const geminiResults = await this.OpenAIService.analyzeDocumentClauses(
        fullText,
        -1,
      );


      const contract = new Contract();
      contract.type = dto.type;
      contract.jurisdiction =
        geminiResults[0]?.jurisdiction || dto.jurisdiction || 'Unknown';
      contract.content_html = fullText;
      contract.source = dto.source || 'Upload';

     
      const contractData = {
        jurisdiction: contract.jurisdiction,
        clauses: geminiResults,
      };

      try {
        ContractSchema.parse(contractData);
      } catch (validationError) {
        throw new BadRequestException(
          `Contract validation failed: ${validationError.message}`,
        );
      }


      const savedContract = await this.contractRepository.save(contract);

   
      const savedClauses = await Promise.all(
        geminiResults.map(async (clauseData) => {
          try {
            ClauseSchema.parse({
              clause_type: clauseData.clause_type,
              risk_level: clauseData.risk_level,
              clause_text: clauseData.clause_text,
              language_variant: clauseData.language_variant || '', 
            });

            const clause = new Clause();
            clause.clause_type = clauseData.clause_type;
            clause.clause_text = clauseData.clause_text;
            clause.risk_level = clauseData.risk_level;
            clause.jurisdiction = clauseData.jurisdiction;
            clause.language_variant = clauseData.language_variant || ''; 
            clause.notes = '';

            return await this.clauseRepository.save(clause);
          } catch (validationError) {
            console.error(
              `Clause validation failed: ${validationError.message}`,
            );
            return null;
          }
        }),
      );

      const validClauses = savedClauses.filter((clause) => clause !== null);

    
      return {
        contract: savedContract,
        clauses: validClauses,
        message: `Contract saved with ${validClauses.length} valid clauses`,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to process document: ${error.message}`,
      );
    }
  }

  private handleValidationError(error: any) {
    if (error instanceof z.ZodError) {
      throw new BadRequestException(
        `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
      );
    }
    throw new BadRequestException(
      `Failed to process document: ${error.message}`,
    );
  }

  private cleanupTempFile(filePath: string) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  private handleError(error: any, tempFilePath: string) {
    this.cleanupTempFile(tempFilePath);
    throw error;
  }

  @Get('/contracts')
  async getAllContracts() {
    try {
      const contracts = await this.contractRepository.find({
        select: {
          id: true,
          type: true,
          jurisdiction: true,
          source: true,
          createdAt: true,
        },
        order: {
        createdAt: 'DESC', 
      },
      });
      return {
        success: true,
        data: contracts,
        count: contracts.length,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch contracts: ${error.message}`,
      );
    }
  }

  @Get('/regulations')
  async getAllRegulations() {
    try {
      const regulations = await this.regulationRepository.find({
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          jurisdiction: true,
          citation: true,
          title: true,
          section: true,
          subject_area: true,
        },
        order: {
        createdAt: 'DESC', 
      },
      });
      return {
        success: true,
        data: regulations,
        count: regulations.length,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch regulations: ${error.message}`,
      );
    }
  }

@Put('contracts/:id')
async updateContract(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() updateContractDto: UpdateContractDto
) {
  try {
    console.log('🛠 Raw Body:', updateContractDto);
    
    // Validate request body
    if (!updateContractDto || Object.keys(updateContractDto).length === 0) {
      throw new BadRequestException('Update data is required');
    }

    // Find the existing contract
    const contract = await this.contractRepository.findOne({ 
      where: { id } 
    });

    if (!contract) {
      throw new BadRequestException('Contract not found');
    }

    const updates: Partial<Contract> = {};
    if (updateContractDto.type !== undefined) updates.type = updateContractDto.type;
    if (updateContractDto.jurisdiction !== undefined) updates.jurisdiction = updateContractDto.jurisdiction;
    if (updateContractDto.source !== undefined) updates.source = updateContractDto.source;
    updates.updatedAt = new Date(); 

    Object.assign(contract, updates);

    const updatedContract = await this.contractRepository.save(contract);

    return {
      success: true,
      data: updatedContract,
      message: 'Contract updated successfully'
    };

  } catch (error) {
    // Handle specific database errors
    if (error?.code === '22P02') {
      throw new BadRequestException('Invalid UUID format');
    }
    throw new BadRequestException(`Failed to update contract: ${error.message}`);
  }
}

@Put('regulations/:id')
async updateRegulation(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() updateRegulationDto: UpdateRegulationDto
) {
  try {
    console.log('🛠 Raw Body:', updateRegulationDto);
    
    // Validate request body
    if (!updateRegulationDto || Object.keys(updateRegulationDto).length === 0) {
      throw new BadRequestException('Update data is required');
    }

    const regulation = await this.regulationRepository.findOne({ 
      where: { id } 
    });

    if (!regulation) {
      throw new BadRequestException('Regulation not found');
    }

    const updates: Partial<Regulation> = {};
    if (updateRegulationDto.title !== undefined) updates.title = updateRegulationDto.title;
    if (updateRegulationDto.jurisdiction !== undefined) updates.jurisdiction = updateRegulationDto.jurisdiction;
    if (updateRegulationDto.citation !== undefined) updates.citation = updateRegulationDto.citation;
    if (updateRegulationDto.section !== undefined) updates.section = updateRegulationDto.section;
    if (updateRegulationDto.subject_area !== undefined) updates.subject_area = updateRegulationDto.subject_area;
    updates.updated_at = new Date().toISOString();

    Object.assign(regulation, updates);
    const updatedRegulation = await this.regulationRepository.save(regulation);

    return {
      success: true,
      data: updatedRegulation,
      message: 'Regulation updated successfully'
    };

  } catch (error) {
    // Handle specific database errors
    if (error?.code === '22P02') {
      throw new BadRequestException('Invalid UUID format');
    }
    throw new BadRequestException(`Failed to update regulation: ${error.message}`);
  }
}

}
