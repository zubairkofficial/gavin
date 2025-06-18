import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { Document } from './entities/document.entity';
import { Regulation } from './entities/regulation.entity';
import { Contract } from './entities/contract.entity';
import { OpenAIService } from '../services/openai.service';
import { Clause } from './entities/clause.entity';
import { Statute } from './entities/statute.entity';
import { OpenAIServiceRegulation } from '@/services/openai.regulations.service';
import { EmbeddingService } from './services/embedding.service';
import { OpenAIStatuteService } from '@/services/openai.statute.service';

@Module({
  imports: [TypeOrmModule.forFeature([Document, Regulation, Contract, Clause, Statute])],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    OpenAIServiceRegulation,
    OpenAIStatuteService,
    OpenAIService,
    EmbeddingService,
  ],
})
export class DocumentsModule {}

