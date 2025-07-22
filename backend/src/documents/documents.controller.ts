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
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as fs from 'fs';
import { boolean, z } from 'zod';
import { Contract } from './entities/contract.entity';
import { Clause } from './entities/clause.entity';
import { Regulation } from './entities/regulation.entity';
import { Statute } from './entities/statute.entity';
import { OpenAIService } from './services/openai.service';
import { ContractSchema, ClauseSchema } from './schemas/contract.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { UpdateRegulationDto } from './dto/update-regulation.dto';
import { DocumentsService } from './documents.service';
import { OpenAIServiceRegulation } from '@/documents/services/openai.regulations.service';
import { EmbeddingService } from '../documents/services/embedding.service';
import { OpenAIStatuteService } from '@/documents/services/openai.statute.service';
import { UpdateStatuteDto } from './dto/update-Case.dto';
import * as multer from 'multer';
import { Public } from '@/auth/decorators/public.decorator';
import type { File as MulterFile } from 'multer';
import * as path from 'path';
import { Response } from 'express';
import axios from 'axios';
import { Case } from './entities/case.entity';
import { UpdateCaseDto } from './dto/update.case.dto';

// Configure multer storage to save files with original names in uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'uploads');

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Created uploads directory:', uploadsDir);
    }

    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename to prevent conflicts
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExtension);

    // Create unique filename: originalname_timestamp_random.ext
    const uniqueFileName = `${baseName}${fileExtension}`;

    console.log('💾 Storing file as:', uniqueFileName);
    cb(null, uniqueFileName);
  }
});

@Controller('/documents')
@UseGuards(AuthGuard)
export class DocumentsController {
  constructor(
    private dataSource: DataSource,
    private readonly documentsService: DocumentsService,
    @InjectRepository(Regulation)
    private regulationRepository: Repository<Regulation>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Clause)
    private clauseRepository: Repository<Clause>,
    @InjectRepository(Statute)
    private statuteRepository: Repository<Statute>,
    private OpenAIService: OpenAIService,
    private OpenServiceRegulation: OpenAIServiceRegulation,
    private OpenAICaseService: OpenAIStatuteService,
    private embeddingService: EmbeddingService,
  ) { }

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file', {
    storage,
    fileFilter: (req, file, cb) => {
      // Validate file types at multer level
      const supportedTypes = [
        'text/plain',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png',
        'image/jpeg',
      ];

      if (supportedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException(
          `Unsupported file type: ${file.mimetype}. Supported types are: text, pdf, and doc/docx`
        ), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    }
  }))
  async uploadDocument(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: MulterFile,
    @Request() req: any,
  ) {
    console.log('📤 Upload request received:', {
      originalName: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
      documentType: createDocumentDto?.type
    });

    // Validate file presence
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // File is automatically saved to uploads folder by multer
    const filePath = file.path;
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const relativeToUploads = path.relative(uploadsDir, filePath).replace(/\\/g, '/');

    console.log('💾 File stored at:', {
      fullPath: filePath,
      relativePath: relativeToUploads,
      exists: fs.existsSync(filePath)
    });

    // Update DTO with file information
    createDocumentDto.fileName = file.originalname;
    createDocumentDto.filePath = relativeToUploads;

    try {
      // Extract and process text from the stored file
      const fullText = await this.extractTextFromFile(file, filePath);

      // Validate extracted text
      if (!fullText || fullText.length < 10) {
        throw new BadRequestException('Could not extract sufficient text from document');
      }

      console.log('📄 Text extraction successful:', {
        textLength: fullText.length,
        firstChars: fullText.substring(0, 100)
      });

      // Process document based on type
      return await this.processDocumentByType(createDocumentDto, fullText, req.user?.id);

    } catch (error) {
      // Clean up uploaded file on error
      this.cleanupTempFile(filePath);

      if (error instanceof BadRequestException) {
        throw error;
      } else {
        console.error('❌ Upload processing error:', error);
        throw new BadRequestException(`Failed to process document: ${error.message}`);
      }
    }
  }

  /**
   * Extract text from uploaded file based on its type
   */
  private async extractTextFromFile(file: MulterFile, filePath: string): Promise<string> {
    let fullText = '';

    try {
      if (file.mimetype === 'text/plain') {
        // Read plain text files directly
        fullText = await fs.promises.readFile(filePath, 'utf8');
      } else {
        // Use document service for other file types (PDF, DOC, DOCX)
        fullText = await this.documentsService.parseDocument(filePath, file.mimetype);
      }

      if (!fullText || typeof fullText !== 'string') {
        throw new Error('Document parsing failed: empty or invalid content');
      }

      // Sanitize and clean the extracted text
      return this.sanitizeText(fullText);

    } catch (error) {
      console.error('❌ Text extraction failed:', error);
      throw new BadRequestException(`Failed to extract text from document: ${error.message}`);
    }
  }

  /**
   * Sanitize and clean extracted text
   */
  private sanitizeText(text: string): string {
    // Enhanced text sanitization
    const cleanText = text
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

    // Validate final text length and truncate if necessary
    if (cleanText.length > 100000) {
      console.warn(`⚠️ Document length (${cleanText.length}) exceeds limit, truncating...`);
      return cleanText.substring(0, 100000);
    }

    // Remove null bytes if any remain
    return cleanText.replace(/\0/g, '').trim();
  }


  @Post('/scrape/url')
  async scrapeUrl(
    @Body() createDocumentDto: CreateDocumentDto,
    @Request() req: any,
  ) {

    console.log(`the url ${createDocumentDto.filePath} , and the type is ${createDocumentDto.type}`)
    if (!createDocumentDto.filePath || !createDocumentDto.type) {
      throw new BadRequestException('Both url and type are required');
    }

    console.log(`🌐 Scrape request received:  ${createDocumentDto.filePath} , ${createDocumentDto.type}`);



    createDocumentDto.source_url = 'scraper'

    try {
      const response = await axios.get(createDocumentDto.filePath);
      if (response.status < 200 || response.status >= 300) {
        throw new BadRequestException(`Failed to fetch URL: ${response.statusText}`);
      }
      const html = response.data;

      // Parse and extract text using Cheerio
      const cheerio = require('cheerio');
      const $ = cheerio.load(html);

      // Extract visible text from the body
      let fullText = $('body').text();

      // Sanitize the extracted text
      fullText = this.sanitizeText(fullText);

      // Validate extracted text
      if (!fullText || fullText.length < 10) {
        throw new BadRequestException('Could not extract sufficient text from the URL');
      }

      console.log('📄 URL text extraction successful:', {
        textLength: fullText.length,
        firstChars: fullText.substring(0, 100),
      })

      // Process document based on type
      return await this.processDocumentByType(createDocumentDto, fullText, req.user?.id);

    } catch (error) {
      console.error('❌ URL scraping error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to scrape URL: ${error.message}`);
    }
  }

  private async processDocumentByType(dto: CreateDocumentDto, fullText: string, userId: string) {
    const documentType = dto.type?.toLowerCase();

    console.log('🔄 Processing document type:', documentType);

    switch (documentType) {
      case 'regulation':
        return this.handleRegulation(dto, fullText, userId);

      case 'contract':
        return this.handleContract(dto, fullText, userId);

      case 'statute':
      case 'statutes':
        return this.handleStatute(dto, fullText, userId);

      default:
        throw new BadRequestException(`Document type not recognized: ${dto.type}`);
    }
  }

  private async handleRegulation(dto: CreateDocumentDto, fullText: string, userId: string) {
    try {
      console.log('📋 Processing regulation for user:', userId);

      const analysisResults = await this.OpenServiceRegulation.analyzeRegulations(fullText);

      if (!analysisResults || !analysisResults[0]) {
        throw new BadRequestException('Failed to analyze regulation content');
      }

      const analysis = analysisResults[0];
      const regulation = new Regulation();
      regulation.content_html = fullText;
      regulation.title = dto.title || analysis.title;
      regulation.fileName = dto.fileName || dto.filePath?.split('//')[1]?.substring(0, 20);
      regulation.filePath = dto.filePath;
      regulation.userId = userId;
      regulation.type = dto.type;
      regulation.jurisdiction = dto.jurisdiction || 'Unknown';
      regulation.citation = analysis.citation || dto.citation || '';
      regulation.section = analysis.section || dto.section || '';
      regulation.subject_area = analysis.subject_area || dto.subject_area || '';
      regulation.summary = analysis.summary || dto.summary || '';
      regulation.source_url = dto.source_url || 'Upload';
      regulation.updated_at = new Date().toISOString();

      const savedRegulation = await this.regulationRepository.save(regulation);

      // Create embeddings
      await this.embeddingService.processDocument({
        documentId: savedRegulation.id,
        content: fullText,
        additionalMetadata: {
          document_id: savedRegulation.id,
          document_type: savedRegulation.type,
          processed_date: new Date().toISOString(),
          enabled: true
        }
      });

      return {
        success: true,
        status: 'completed',
        data: {
          id: savedRegulation.id,
          title: savedRegulation.title,
          fileName: savedRegulation.fileName,
          filePath: savedRegulation.filePath,
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
      console.error('❌ Regulation processing failed:', error);
      throw new BadRequestException(`Failed to process regulation: ${error.message}`);
    }
  }

  private async handleContract(dto: CreateDocumentDto, fullText: string, userId: string) {
    try {
      console.log('📄 Processing contract for user:', userId);

      const geminiResults = await this.OpenAIService.analyzeDocumentClauses(fullText, -1);

      let filePath = dto.filePath;

      // if (!filePath.startsWith('http://') && !filePath.startsWith('https://')) {
      //   filePath = `${process.env.BASE_URL}/static/files${filePath}`;
      // }

      const contract = new Contract();
      contract.type = dto.type;
      contract.title = dto.title;
      contract.userId = userId;
      contract.fileName = dto.fileName || dto.filePath?.split('//')[1]?.substring(0, 20);
      contract.filePath = dto.filePath;
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
        throw new BadRequestException(`Contract validation failed: ${validationError.message}`);
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
            clause.contract_id = savedContract.id;

            return await this.clauseRepository.save(clause);
          } catch (validationError) {
            console.error(`❌ Clause validation failed: ${validationError.message}`);
            return null;
          }
        }),
      );

      const validClauses = savedClauses.filter((clause) => clause !== null);

      // Create embeddings
      await this.embeddingService.processDocument({
        documentId: savedContract.id,
        content: fullText,
        additionalMetadata: {
          document_id: savedContract.id,
          document_type: savedContract.type,
          processed_date: new Date().toISOString(),
          enabled: true
        }
      });

      return {
        success: true,
        status: 'completed',
        data: {
          id: savedContract.id,
          type: savedContract.type,
          fileName: savedContract.fileName,
          filePath: savedContract.filePath,
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
      console.error('❌ Contract processing failed:', error);
      throw new BadRequestException(`Failed to process contract: ${error.message}`);
    }
  }

  private async handleStatute(dto: CreateDocumentDto, fullText: string, userId: string) {
    try {
      console.log('⚖️ Processing statute for user:', userId);

      const analysisResults = await this.OpenAICaseService.analyzeStatuteDocument(fullText);

      if (!analysisResults || !analysisResults.statute_info) {
        console.error('❌ Analysis failed - no results:', analysisResults);
        throw new BadRequestException('Failed to analyze statute content');
      }

      const analysis = analysisResults.statute_info;

      const StatuteEntity = new Statute();
      StatuteEntity.content_html = fullText;
      StatuteEntity.title = dto.title;
      StatuteEntity.userId = userId;
      StatuteEntity.type = dto.type || 'statute';
      StatuteEntity.source_url = dto.source_url || 'Upload';
      StatuteEntity.fileName = dto.fileName || dto.filePath?.split('//')[1]?.substring(0, 20);
      StatuteEntity.filePath = dto.filePath;
      StatuteEntity.court = analysis.court;
      StatuteEntity.jurisdiction = dto.jurisdiction || '';
      StatuteEntity.decision_date = analysis.decision_date;
      StatuteEntity.citation = analysis.citation;
      StatuteEntity.holding_summary = analysis.holding_summary;
      StatuteEntity.tags = Array.isArray(analysis.tags) ? analysis.tags : [];
      StatuteEntity.source_url = dto.source_url || '';

      const savedStatute = await this.statuteRepository.save(StatuteEntity);

      // Create embeddings
      await this.embeddingService.processDocument({
        documentId: savedStatute.id,
        content: fullText,
        additionalMetadata: {
          document_id: savedStatute.id,
          document_type: savedStatute.type,
          processed_at: new Date().toISOString(),
          enabled: true,
          source: dto.source || 'Upload',
        }
      });

      return {
        success: true,
        status: 'completed',
        data: {
          id: savedStatute.id,
          name: savedStatute.title,
          fileName: savedStatute.fileName,
          filePath: savedStatute.filePath,
          court: savedStatute.court,
          jurisdiction: savedStatute.jurisdiction,
          documentType: 'statute',
          processingDetails: {
            textLength: fullText.length,
            analyzed: true,
            embedded: true,
            citation: savedStatute.citation,
            decision_date: savedStatute.decision_date,
            processed_at: new Date().toISOString()
          }
        },
        message: 'Statute successfully processed, analyzed, and embedded'
      };

    } catch (error) {
      console.error('❌ Statute processing failed:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to process statute: ${error.message}`);
    }
  }

  /**
   * Clean up temporary files
   */
  private cleanupTempFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Cleaned up temp file:', filePath);
      }
    } catch (error) {
      console.error('⚠️ Failed to cleanup temp file:', error);
    }
  }

  // ... rest of the methods remain unchanged (GET, PUT endpoints)

  @Get('/contracts')
  async getAllContracts(@Request() req: any) {
    console.log('📋 Getting contracts for user:', req.user?.id);
    try {
      const contracts = await this.contractRepository.find({
        select: {
          id: true,
          type: true,
          title: true,
          fileName: true,
          filePath: true,
          isEnabled: true,
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
      throw new BadRequestException(`Failed to fetch contracts: ${error.message}`);
    }
  }
  @Get('/cases')
  async getAllCases(@Request() req: any) {
    console.log('📋 Getting contracts for user:', req.user?.id);
    try {
      const contracts = await this.caseRepository.find({
        select: {
          id: true,
          case_type: true,
          name: true,
          fileName: true,
          filePath: true,
          type: true,
          isEnabled: true,
          jurisdiction: true,
          source_url: true,
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
      throw new BadRequestException(`Failed to fetch contracts: ${error.message}`);
    }
  }

  @Get('/statutes')
  async getAllStatute(@Request() req: any) {
    console.log('📋 Getting statutes for user:', req.user?.id);
    try {
      const statute = await this.statuteRepository.find({
        select: {
          id: true,
          title: true,
          fileName: true,
          filePath: true,
          jurisdiction: true,
          type: true,
          code: true,
          court: true,
          source_url: true,
          citation: true,
          holding_summary: true,
          decision_date: true,
          isEnabled: true,
          createdAt: true,
        },
        order: {
          createdAt: 'DESC',
        },
      });
      return {
        success: true,
        data: statute,
        count: statute.length,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch statutes: ${error.message}`);
    }
  }

  @Get('/regulations')
  async getAllRegulations(@Request() req: any) {
    console.log('📋 Getting regulations for user:', req.user?.id);
    try {
      const regulations = await this.regulationRepository.find({
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          type: true,
          isEnabled: true,
          jurisdiction: true,
          citation: true,
          title: true,
          source_url: true,
          fileName: true,
          filePath: true,
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
      throw new BadRequestException(`Failed to fetch regulations: ${error.message}`);
    }
  }

  @Put('contracts/:id')
  async updateContract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateContractDto: UpdateContractDto
  ) {
    try {
      console.log('🛠 Raw Body:', updateContractDto);

      if (!updateContractDto || Object.keys(updateContractDto).length === 0) {
        throw new BadRequestException('Update data is required');
      }

      const contract = await this.contractRepository.findOne({ where: { id } });

      if (!contract) {
        throw new BadRequestException('Contract not found');
      }

      const updates: Partial<Contract> = {};
      if (updateContractDto.title !== undefined) updates.title = updateContractDto.title;
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
      if (error?.code === '22P02') {
        throw new BadRequestException('Invalid UUID format');
      }
      throw new BadRequestException(`Failed to update contract: ${error.message}`);
    }
  }
  @Put('cases/:id')
  async updateCases(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCasetDto: UpdateCaseDto
  ) {
    try {
      console.log('🛠 Raw Body:', updateCasetDto);

      if (!updateCasetDto || Object.keys(updateCasetDto).length === 0) {
        throw new BadRequestException('Update data is required');
      }

      const contract = await this.caseRepository.findOne({ where: { id } });

      if (!contract) {
        throw new BadRequestException('Contract not found');
      }

      const updates: Partial<Case> = {};
      if (updateCasetDto.jurisdiction !== undefined) updates.jurisdiction = updateCasetDto.jurisdiction;
      if (updateCasetDto.case_type !== undefined) updates.case_type = updateCasetDto.case_type;
      updates.updatedAt = new Date();

      Object.assign(contract, updates);
      const updatedContract = await this.caseRepository.save(contract);

      return {
        success: true,
        data: updatedContract,
        message: 'Contract updated successfully'
      };

    } catch (error) {
      if (error?.code === '22P02') {
        throw new BadRequestException('Invalid UUID format');
      }
      throw new BadRequestException(`Failed to update contract: ${error.message}`);
    }
  }

  @Put('statutes/:id')
  async updateStatute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatuteDto: UpdateStatuteDto
  ) {
    try {
      console.log('🛠 Raw Body:', updateStatuteDto);

      if (!updateStatuteDto || Object.keys(updateStatuteDto).length === 0) {
        throw new BadRequestException('Update data is required');
      }

      const statute = await this.statuteRepository.findOne({ where: { id } });

      if (!statute) {
        throw new BadRequestException('Statute not found');
      }

      const updates: Partial<Statute> = {};
      if (updateStatuteDto.title !== undefined) updates.title = updateStatuteDto.title;
      if (updateStatuteDto.jurisdiction !== undefined) updates.jurisdiction = updateStatuteDto.jurisdiction;
      if (updateStatuteDto.court !== undefined) updates.court = updateStatuteDto.court;
      if (updateStatuteDto.citation !== undefined) updates.citation = updateStatuteDto.citation;
      if (updateStatuteDto.holding_summary !== undefined) updates.holding_summary = updateStatuteDto.holding_summary;
      if (updateStatuteDto.decision_date !== undefined) updates.decision_date = updateStatuteDto.decision_date;
      updates.updatedAt = new Date();

      Object.assign(statute, updates);
      const updatedStatute = await this.statuteRepository.save(statute);

      return {
        success: true,
        data: updatedStatute,
        message: 'Statute updated successfully'
      };

    } catch (error) {
      if (error?.code === '22P02') {
        throw new BadRequestException('Invalid UUID format');
      }
      throw new BadRequestException(`Failed to update Statute: ${error.message}`);
    }
  }

  @Put('regulations/:id')
  async updateRegulation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRegulationDto: UpdateRegulationDto
  ) {
    try {
      console.log('🛠 Raw Body:', updateRegulationDto);

      if (!updateRegulationDto || Object.keys(updateRegulationDto).length === 0) {
        throw new BadRequestException('Update data is required');
      }

      const regulation = await this.regulationRepository.findOne({ where: { id } });

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
      if (error?.code === '22P02') {
        throw new BadRequestException('Invalid UUID format');
      }
      throw new BadRequestException(`Failed to update regulation: ${error.message}`);
    }
  }


  @Put('/metadata/statute/:id')
  async updateMetadata(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() newMetadata: Record<string, boolean>,
    @Request() req: any
  ) {
    try {
      console.log('📋 Updating metadata for document:', id);

      const document = await this.statuteRepository.findOne({ where: { id } })
      if (!document) {
        return { message: 'document not fount' }
      }
      document.isEnabled = !document.isEnabled
      console.log(document.isEnabled)
      this.statuteRepository.save(document)

      await this.dataSource
        .createQueryBuilder()
        .update('document_embeddings')
        .set({
          metadata: () =>
            `jsonb_set(metadata, '{enabled}', '${document.isEnabled}'::jsonb)`
        })
        .where("metadata->>'document_id' = :id", { id })
        .execute();

      return {
        success: true,
        data: {
          id,
          userId: req.user?.id,
          metadata: newMetadata
        },
      };

    } catch (error) {
      console.error('Error updating document metadata:', error);

      if (error?.code === '22P02') {
        throw new BadRequestException('Invalid UUID format');
      }

      throw new BadRequestException(`Failed to update document metadata: ${error.message}`);
    }
  }
  @Put('/metadata/case/:id')
  async updateCaseMetadata(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() newMetadata: Record<string, boolean>,
    @Request() req: any
  ) {
    try {
      console.log('📋 Updating metadata for document:', id);

      const document = await this.caseRepository.findOne({ where: { id } })
      if (!document) {
        return { message: 'document not fount' }
      }
      document.isEnabled = !document.isEnabled
      console.log(document.isEnabled)
      this.caseRepository.save(document)

      await this.dataSource
        .createQueryBuilder()
        .update('document_embeddings')
        .set({
          metadata: () =>
            `jsonb_set(metadata, '{enabled}', '${document.isEnabled}'::jsonb)`
        })
        .where("metadata->>'document_id' = :id", { id })
        .execute();

      return {
        success: true,
        data: {
          id,
          userId: req.user?.id,
          metadata: newMetadata
        },
      };

    } catch (error) {
      console.error('Error updating document metadata:', error);

      if (error?.code === '22P02') {
        throw new BadRequestException('Invalid UUID format');
      }

      throw new BadRequestException(`Failed to update document metadata: ${error.message}`);
    }
  }

  @Put('/metadata/regulation/:id')
  async updateMetaRegulation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() newMetadata: Record<string, boolean>,
    @Request() req: any
  ) {
    try {
      console.log('📋 Updating metadata for document:', id);

      const document = await this.regulationRepository.findOne({ where: { id } })
      if (!document) {
        return { message: 'document not fount' }
      }
      document.isEnabled = !document.isEnabled
      console.log(document.isEnabled)
      this.regulationRepository.save(document)

      await this.dataSource
        .createQueryBuilder()
        .update('document_embeddings')
        .set({
          metadata: () =>
            `jsonb_set(metadata, '{enabled}', '${document.isEnabled}'::jsonb)`
        })
        .where("metadata->>'document_id' = :id", { id })
        .execute();


      console.log(
        id,
        req.user?.id,
        newMetadata
      )

      return {
        success: true,
        data: {
          id,
          userId: req.user?.id,
          metadata: newMetadata
        },
      };

    } catch (error) {
      console.error('Error updating document metadata:', error);

      if (error?.code === '22P02') {
        throw new BadRequestException('Invalid UUID format');
      }

      throw new BadRequestException(`Failed to update document metadata: ${error.message}`);
    }
  }

  @Put('/metadata/contract/:id')
  async updateMetacontract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() newMetadata: Record<string, boolean>,
    @Request() req: any
  ) {
    try {
      console.log('📋 Updating metadata for document:', id);

      const document = await this.contractRepository.findOne({ where: { id } })
      if (!document) {
        return { message: 'document not fount' }
      }
      document.isEnabled = !document.isEnabled
      console.log(document.isEnabled)
      this.contractRepository.save(document)

      await this.dataSource
        .createQueryBuilder()
        .update('document_embeddings')
        .set({
          metadata: () =>
            `jsonb_set(metadata, '{enabled}', '${document.isEnabled}'::jsonb)`
        })
        .where("metadata->>'document_id' = :id", { id })
        .execute();

      return {
        success: true,
        data: {
          id,
          userId: req.user?.id,
          metadata: newMetadata
        },
      };

    } catch (error) {
      console.error('Error updating document metadata:', error);

      if (error?.code === '22P02') {
        throw new BadRequestException('Invalid UUID format');
      }

      throw new BadRequestException(`Failed to update document metadata: ${error.message}`);
    }
  }


  @Get('contracts/:id')
  async viewContract(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const contract = await this.contractRepository.findOne({ where: { id } });

      if (!contract) {
        throw new BadRequestException('Contract not found');
      }

      return {
        success: true,
        content_html: contract.content_html,
        message: 'Contract retrieved successfully'
      };

    } catch (error) {
      if (error?.code === '22P02') {
        throw new BadRequestException('Invalid UUID format');
      }
      throw new BadRequestException(`Failed to view contract data: ${error.message}`);
    }
  }
  @Get('cases/:id')
  async viewCase(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const contract = await this.caseRepository.findOne({ where: { id } });

      if (!contract) {
        throw new BadRequestException('Contract not found');
      }

      return {
        success: true,
        content_html: contract.content_html,
        message: 'Contract retrieved successfully'
      };

    } catch (error) {
      if (error?.code === '22P02') {
        throw new BadRequestException('Invalid UUID format');
      }
      throw new BadRequestException(`Failed to view contract data: ${error.message}`);
    }
  }

  @Get('regulations/:id')
  async viewRegulation(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const regulation = await this.regulationRepository.findOne({ where: { id } });

      if (!regulation) {
        throw new BadRequestException('Contract not found');
      }

      return {
        success: true,
        content_html: regulation.content_html,
        message: 'Contract retrieved successfully'
      };

    } catch (error) {
      if (error?.code === '22P02') {
        throw new BadRequestException('Invalid UUID format');
      }
      throw new BadRequestException(`Failed to view contract data: ${error.message}`);
    }
  }


  @Get('statutes/:id')
  async viewStatute(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const statute = await this.statuteRepository.findOne({ where: { id } });

      if (!statute) {
        throw new BadRequestException('Statute not found');
      }

      return {
        success: true,
        content_html: statute.content_html,
        message: 'Statute retrieved successfully'
      };

    } catch (error) {
      if (error?.code === '22P02') {
        throw new BadRequestException('Invalid UUID format');
      }
      throw new BadRequestException(`Failed to view statute data: ${error.message}`);
    }
  }






}