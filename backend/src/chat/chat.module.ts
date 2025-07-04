import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { Message } from './entities/message.entity';
import openaiConfig from '../config/gemini.config';
import { ChatService } from './chat.service';
import { Contract } from '@/documents/entities/contract.entity';
import { Regulation } from '@/documents/entities/regulation.entity';
import { Case } from '@/documents/entities/case.entity';
import { Statute } from '@/documents/entities/statute.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message , Contract , Regulation , Case , Statute]),
    ConfigModule.forFeature(openaiConfig),
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [],
})
export class ChatModule {}