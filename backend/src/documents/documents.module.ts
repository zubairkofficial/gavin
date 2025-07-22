import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { Document } from './entities/document.entity';
import { Regulation } from './entities/regulation.entity';
import { Contract } from './entities/contract.entity';
import { OpenAIService } from './services/openai.service';
import { Clause } from './entities/clause.entity';
import { Statute } from './entities/statute.entity';
import { OpenAIServiceRegulation } from '@/documents/services/openai.regulations.service';
import { EmbeddingService } from '../documents/services/embedding.service';
import { OpenAIStatuteService } from '@/documents/services/openai.statute.service';
import { AuthModule } from '../auth/auth.module';
import { Status } from './entities/status.entity';
import { Case } from './entities/case.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, Regulation, Contract, Clause, Statute , Status , Case]),
    AuthModule,
    ConfigModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'defaultSecret',
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
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

