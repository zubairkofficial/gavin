import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { Document } from './entities/document.entity';
import { Regulation } from './entities/regulation.entity';
import { Contract } from './entities/contract.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Document, Regulation, Contract])],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
