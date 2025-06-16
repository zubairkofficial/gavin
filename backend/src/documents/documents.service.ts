import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Document } from './entities/document.entity';
import * as fs from 'fs';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';

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
          const pdfLoader = new PDFLoader(filePath);
          const pdfDocs = await pdfLoader.load();
          return pdfDocs.map(doc => doc.pageContent).join('\n');

        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          const docLoader = new DocxLoader(filePath);
          const docDocs = await docLoader.load();
          return docDocs.map(doc => doc.pageContent).join('\n');

        default:
          throw new Error(`Unsupported mime type: ${mimeType}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse document: ${error.message}`);
    }
  }
}
