import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Public } from '../auth/decorators/public.decorator';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Regulation } from './entities/regulation.entity';
import { Contract } from './entities/contract.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Controller('/documents')
@Public()
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    @InjectRepository(Regulation)
    private regulationRepository: Repository<Regulation>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
  ) {}

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-${file.originalname}`);

    // Save buffer temporarily to disk (LangChain needs a file path)
    fs.writeFileSync(tempFilePath, file.buffer);

    let loader;
    switch (ext) {
      case '.pdf':
        loader = new PDFLoader(tempFilePath);
        break;
      case '.txt':
        loader = new TextLoader(tempFilePath);
        break;
      case '.docx':
        loader = new DocxLoader(tempFilePath);
        break;
      default:
        fs.unlinkSync(tempFilePath);
        throw new BadRequestException('Unsupported file type');
    }

    try {
      const docs = await loader.load();
      const fullText = docs.map(doc => doc.pageContent).join('\n');

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);
      console.log(`createDocumentDto.type: ${createDocumentDto.type.toLocaleLowerCase()}`);
      // Based on document type, store in appropriate entity
      switch (createDocumentDto.type?.toLowerCase()) {
        case 'statute/regulation':
          const regulation = new Regulation();
          regulation.full_text = fullText;
          regulation.title = createDocumentDto.title;
          regulation.jurisdiction = createDocumentDto.jurisdiction || 'Unknown';
          regulation.citation = createDocumentDto.citation || '';
          regulation.section = createDocumentDto.section || '';
          regulation.subject_area = createDocumentDto.subject_area || '';
          regulation.summary = createDocumentDto.summary || '';
          regulation.source_url = createDocumentDto.source_url || '';
          regulation.updated_at = new Date().toISOString();
          
          return this.regulationRepository.save(regulation);

        case 'contract template':
          const contract = new Contract();
          contract.content_html = fullText;
          contract.type = createDocumentDto.type;
          contract.jurisdiction = createDocumentDto.jurisdiction || 'Unknown';
          contract.version_label = createDocumentDto.version_label || '1.0';
          contract.source = createDocumentDto.source || 'Upload';
          
          return this.contractRepository.save(contract);

        default:
          // If type is not specified or unknown, use the default document service
          // return this.documentsService.create({
          //   ...createDocumentDto,
          //   content: fullText,
          // });
          return console.log('Document type not recognized, skipping save:');
      }
    } catch (error) {
      // Clean up temp file in case of error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw error;
    }
  }

  @Post()
  create(@Body() createDocumentDto: CreateDocumentDto) {
    return this.documentsService.create(createDocumentDto);
  }



  // @Get()
  // findAll() {
  //   return this.documentsService.findAll();
  // }

  // @Get(':id')
  // findOne(
  //   @Param('id', new ParseIntPipe({ 
  //     errorHttpStatusCode: HttpStatus.BAD_REQUEST,
  //     exceptionFactory: () => new BadRequestException('ID must be a valid integer')
  //   })) 
  //   id: number
  // ) {
  //   return this.documentsService.findOne(id);
  // }

  // @Patch(':id')
  // update(@Param('id', ParseIntPipe) id: number, @Body() updateDocumentDto: UpdateDocumentDto) {
  //   return this.documentsService.update(id, updateDocumentDto);
  // }

  // @Delete(':id')
  // remove(@Param('id', ParseIntPipe) id: number) {
  //   return this.documentsService.remove(id);
  // }
}
