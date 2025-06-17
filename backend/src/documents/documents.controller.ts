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
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import * as fs from 'fs';
import { z } from 'zod';
import { Contract } from './entities/contract.entity';
import { Clause } from './entities/clause.entity';
import { Regulation } from './entities/regulation.entity';
import { Case } from './entities/case.entity';
import { OpenAIService } from '../services/openai.service';
import { ContractSchema, ClauseSchema } from './schemas/contract.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { UpdateRegulationDto } from './dto/update-regulation.dto';
import { Public } from '../auth/decorators/public.decorator';
import { DocumentsService } from './documents.service';
import { OpenAIServiceRegulation } from '@/services/openai.regulations.service';
import { EmbeddingService } from './services/embedding.service';
import { OpenAICaseService } from '@/services/openai.case.service';
import { UpdateCaseDto } from './dto/update-Case.dto';

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
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    private OpenAIService: OpenAIService,
    private OpenServiceRegulation: OpenAIServiceRegulation,
    private OpenAICaseService: OpenAICaseService,
    private embeddingService: EmbeddingService,
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

      console.log('Document upload request:', { type: createDocumentDto.type, title: createDocumentDto.title  , jurisdiction: createDocumentDto.jurisdiction  , name: createDocumentDto.fileName });

      switch (createDocumentDto.type?.toLowerCase()) {
        case 'regulation':
          return this.handleRegulation(createDocumentDto, fullText);

        case 'contract':
          return this.handleContract(createDocumentDto, fullText);

        case 'case':
        case 'cases':  // Adding support for plural form
          console.log('Handling case document upload');
          return this.handleCase(createDocumentDto, fullText);

        default:
          console.log('Unrecognized document type:', createDocumentDto.type);
          throw new BadRequestException(`Document type not recognized: ${createDocumentDto.type}`);
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
      regulation.type = dto.type ;
      regulation.jurisdiction =  dto.jurisdiction || 'Unknown';
      regulation.citation = analysis.citation || dto.citation || '';
      regulation.section = analysis.section || dto.section || '';
      regulation.subject_area = analysis.subject_area || dto.subject_area || '';
      regulation.summary = analysis.summary || dto.summary || '';
      regulation.source_url = dto.source_url || '';
      regulation.updated_at = new Date().toISOString();

      // Save to database
      const savedRegulation = await this.regulationRepository.save(regulation);

      // Create embeddings for the regulation with only document ID in metadata
      await this.embeddingService.processDocument({
        documentId: savedRegulation.id,
        userId: dto.userId || 'system',
        content: fullText,
        documentType: 'regulation',
        jurisdiction: dto.jurisdiction,
        additionalMetadata: {
          document_id: savedRegulation.id
        }
      });

      return {
        success: true,
        status: 'completed',
        data: {
          id: savedRegulation.id,
          title: savedRegulation.title,
          jurisdiction: dto.jurisdiction,
          documentType: 'regulation',
          processingDetails: {
            textLength: fullText.length,
            analyzed: true,
            embedded: true,
            citation: savedRegulation.citation,
            section: savedRegulation.section,
            subject_area: savedRegulation.subject_area,
            processed_at: new Date().toISOString()
          }
        },
        message: 'Regulation successfully processed, analyzed, and embedded'
      };

    } catch (error) {
      throw new BadRequestException(
        `Failed to process regulation: ${error.message}`,
      );
    }
  }

  private async handleContract(dto: CreateDocumentDto, fullText: string) {
    try {
      const geminiResults = await this.OpenAIService.analyzeDocumentClauses(fullText, -1);

      const contract = new Contract();
      contract.type = dto.type;
      contract.fileName= dto.fileName || 'Untitled Contract';
      contract.jurisdiction = dto.jurisdiction || 'Unknown';
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

      // Process clauses
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
            clause.jurisdiction = dto.jurisdiction || '';
            clause.language_variant = clauseData.language_variant || '';
            clause.notes = '';
            clause.contract_id = Number(savedContract.id);

            const savedClause = await this.clauseRepository.save(clause);
            
            // Create embeddings for the clause
            await this.embeddingService.processDocument({
              documentId: savedClause.id,
              userId: dto.userId || 'system',
              content: clauseData.clause_text,
              documentType: 'contract_clause',
              jurisdiction: dto.jurisdiction,
              additionalMetadata: {
                document_id: savedClause.id,
                clause_id: savedClause.id,
                clause_type: clause.clause_type,
                risk_level: clause.risk_level,
                language_variant: clause.language_variant,
                parent_contract_id: savedContract.id,
                processed_date: new Date().toISOString()
              }
            });

            return savedClause;
          } catch (validationError) {
            console.error(`Clause validation failed: ${validationError.message}`);
            return null;
          }
        }),
      );

      const validClauses = savedClauses.filter((clause) => clause !== null);

      // Create embeddings for the full contract
      await this.embeddingService.processDocument({
        documentId: savedContract.id,
        userId: dto.userId || 'system',
        content: fullText,
        documentType: 'contract',
        jurisdiction: savedContract.jurisdiction,
        additionalMetadata: {
          document_id: savedContract.id,
          contract_type: savedContract.type,
          source: savedContract.source,
          total_clauses: validClauses.length,
          processed_date: new Date().toISOString()
        }
      });

      return {
        success: true,
        status: 'completed',
        data: {
          id: savedContract.id,
          type: savedContract.type,
          jurisdiction: savedContract.jurisdiction,
          documentType: 'contract',
          processingDetails: {
            textLength: fullText.length,
            totalClauses: validClauses.length,
            validClauses: validClauses.length,
            analyzed: true,
            embedded: true,
            processed_at: new Date().toISOString()
          },
          clauses: validClauses.map(clause => ({
            id: clause.id,
            type: clause.clause_type,
            risk_level: clause.risk_level,
            jurisdiction: clause.jurisdiction
          }))
        },
        message: `Contract successfully processed with ${validClauses.length} clauses analyzed and embedded`
      };

    } catch (error) {
      throw new BadRequestException(
        `Failed to process document: ${error.message}`,
      );
    }
  }

  private async handleCase(dto: CreateDocumentDto, fullText: string) {
    try {
      console.log('Starting case analysis...');
      const analysisResults = await this.OpenAICaseService.analyzeCaseDocument(fullText);

      if (!analysisResults || !analysisResults.case_info) {
        console.error('Analysis failed - no results:', analysisResults);
        throw new BadRequestException('Failed to analyze case content');
      }

      console.log('Analysis results:', analysisResults);
      const analysis = analysisResults.case_info;
      
      const caseEntity = new Case();
      caseEntity.full_text = fullText;
      caseEntity.title = dto.title ;
      caseEntity.type = dto.type || 'case' ;
      caseEntity.fileName = dto.fileName || '';
      caseEntity.court = analysis.court;
      caseEntity.jurisdiction = dto.jurisdiction || ''; // Extract jurisdiction from court
      caseEntity.decision_date = analysis.decision_date;
      caseEntity.citation = analysis.citation;
      caseEntity.holding_summary = analysis.holding_summary;
      caseEntity.tags = Array.isArray(analysis.tags) ? analysis.tags : [];
      caseEntity.source_url = dto.source_url || '';
      // caseEntity.title = dto.title || analysis.citation;
      
      console.log('Case entity before save:', caseEntity);

      // Save to database
      const savedCase = await this.caseRepository.save(caseEntity);
      console.log('Case saved successfully:', savedCase);

      // Create embeddings for the case
      await this.embeddingService.processDocument({
        documentId: savedCase.id,
        userId: dto.userId || 'system',
        content: fullText,
        documentType: 'case',
        jurisdiction: savedCase.court,
        additionalMetadata: {
          document_id: savedCase.id,
          citation: savedCase.citation,
          court: savedCase.court
        }
      });

      return {
        success: true,
        status: 'completed',
        data: {
          id: savedCase.id,
          name: savedCase.title,
          court: savedCase.court,
          jurisdiction: savedCase.jurisdiction,
          documentType: 'case',
          processingDetails: {
            textLength: fullText.length,
            analyzed: true,
            embedded: true,
            citation: savedCase.citation,
            decision_date: savedCase.decision_date,
            processed_at: new Date().toISOString()
          }
        },
        message: 'Case successfully processed, analyzed, and embedded'
      };

    } catch (error) {
      console.error('Error in handleCase:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to process case: ${error.message}`,
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
          fileName: true,
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

  @Get('/cases')
  async getAllCases() {
    try {
      const cases = await this.caseRepository.find({
        select: {
          id: true,
          title: true,
          fileName: true,
          jurisdiction: true,
          type: true,
          court: true,
          citation: true,
          holding_summary: true,
          decision_date: true,
          createdAt: true,
        },
        order: {
        createdAt: 'DESC', 
      },
      });
      return {
        success: true,
        data: cases,
        count: cases.length,
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
          type: true,
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

@Put('cases/:id')
async updateCase(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() updateCaseDto: UpdateCaseDto
) {
  try {
    console.log('🛠 Raw Body:', updateCaseDto);
    
    // Validate request body
    if (!updateCaseDto || Object.keys(updateCaseDto).length === 0) {
      throw new BadRequestException('Update data is required');
    }

    // Find the existing contract
    const Case = await this.caseRepository.findOne({ 
      where: { id } 
    });

    if (!Case) {
      throw new BadRequestException('Contract not found');
    }

    const updates: Partial<Case> = {};
    if (updateCaseDto.title !== undefined) updates.title = updateCaseDto.title;
    if (updateCaseDto.jurisdiction !== undefined) updates.jurisdiction = updateCaseDto.jurisdiction;
    if (updateCaseDto.court !== undefined) updates.court = updateCaseDto.court;
    if (updateCaseDto.citation !== undefined) updates.citation = updateCaseDto.citation;
    if (updateCaseDto.holding_summary !== undefined) updates.holding_summary = updateCaseDto.holding_summary;
    if (updateCaseDto.decision_date !== undefined) updates.decision_date = updateCaseDto.decision_date;
    updates.updatedAt = new Date(); 

    Object.assign(Case, updates);

    const updatedCase = await this.caseRepository.save(Case);

    return {
      success: true,
      data: updatedCase,
      message: 'Case updated successfully'
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
