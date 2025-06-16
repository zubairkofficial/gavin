import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { Document } from './entities/document.entity';
import { Regulation } from './entities/regulation.entity';
import { Contract } from './entities/contract.entity';
import { OpenAIService } from '../services/openai.service';
import {GeminiServiceRegulation} from '../services/gemini.regulation.service';
import { ClauseSchema, ContractSchema } from './schemas/contract.schema';
import { Clause } from './entities/clause.entity';
import { OpenAIServiceRegulation } from '@/services/openai.regulations.service';
import { EmbeddingService } from './services/embedding.service';
import { DocumentEmbedding } from './entities/document.embedding.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Document, DocumentEmbedding, Regulation, Contract, Clause])],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    GeminiServiceRegulation,
    OpenAIServiceRegulation,
    OpenAIService,
    EmbeddingService,
  ],
})
export class DocumentsModule {}

