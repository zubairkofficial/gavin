import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Document } from './entities/document.entity';
import * as fs from 'fs';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import Tesseract, { createWorker } from 'tesseract.js';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {}

  async create(createDocumentDto: CreateDocumentDto): Promise<Document> {
    const document = this.documentRepository.create(createDocumentDto);
    return await this.documentRepository.save(document);
  }

  async findAll(): Promise<Document[]> {
    return await this.documentRepository.find();
  }

  // async findOne(id: number): Promise<Document> {
  //   return await this.documentRepository.findOneOrFail({ where: { id } });
  // }

  // async update(id: number, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
  //   await this.documentRepository.update(id, updateDocumentDto);
  //   return this.findOne(id);
  // }

  async remove(id: number): Promise<void> {
    await this.documentRepository.delete(id);
  }

  /**
   * Parses a document file at the given path based on its mimetype.
   * Returns the extracted text as a string.
   */
async parseDocument(filePath: string, mimeType: string): Promise<string> {
  try {
    switch (mimeType) {
      case 'application/pdf':
        case 'application/pdf':
        const pdfLoader = new PDFLoader(filePath);
        const pdfDocs = await pdfLoader.load();
        return pdfDocs.map(doc => doc.pageContent).join('\n');
        
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const docLoader = new DocxLoader(filePath);
        const docDocs = await docLoader.load();
        return docDocs.map(doc => doc.pageContent).join('\n');
        
      case 'image/png':
      case 'image/jpeg':
        const worker = await createWorker();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const { data: { text } } = await worker.recognize(filePath);
        await worker.terminate();
        const parsedText = await this.cleanOCRText(text)
        console.log(parsedText)
        return parsedText;
        
      default:
        throw new Error(`Unsupported mime type: ${mimeType}`);
    }
  } catch (error) {
    console.error('Document parsing error:', error);
    throw new Error(`Failed to parse document: ${error.message}`);
  }
}

 cleanOCRText(text: string): string {
  let cleaned = text;
  
  // Remove common OCR artifacts
  cleaned = cleaned
    // Remove mathematical symbols and special characters
    .replace(/[§%\\\/\|\-\+\=\<\>\{\}\[\]]/g, ' ')
    // Remove standalone numbers and letter combinations that don't make sense
    .replace(/\b\d+[a-zA-Z]+\b/g, ' ')
    .replace(/\b[a-zA-Z]+\d+[a-zA-Z]*\b/g, ' ')
    // Remove standalone special characters
    .replace(/[^\w\s\(\)]/g, ' ')
    // Fix common OCR mistakes
    .replace(/\bO\s+(Legged|Wheeled|Hybrid|Hands)\b/g, '• $1') // Convert O to bullet points
    .replace(/\bViL\b/g, '') // Remove OCR artifact
    // Multiple spaces to single space
    .replace(/\s+/g, ' ')
    // Remove very short standalone words (likely OCR errors)
    .replace(/\b[a-zA-Z]\b(?!\s(?:A|I|a))/g, ' ')
    .trim();
  
  // Extract meaningful phrases and reconstruct
  const words = cleaned.split(/\s+/).filter(word => 
    word.length > 1 || ['A', 'I', 'a'].includes(word)
  );
  
  return words.join(' ');
}


}
