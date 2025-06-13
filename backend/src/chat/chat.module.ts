import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import openaiConfig from '../config/gemini.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    ConfigModule.forFeature(openaiConfig),
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [],
})
export class ChatModule {}