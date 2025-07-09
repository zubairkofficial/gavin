import {
  Controller,
  Post,
  Body,
  Res,
  Sse,
  MessageEvent,
  Query,
  Request,
  Get,
  Param,
  UseInterceptors,
  Req,
  UploadedFiles,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { HumanMessage } from '@langchain/core/messages';
import { CreateMessageDto } from './dto/create-message.dto';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as fs from 'fs';
import { OpenAIEmbeddings } from '@langchain/openai';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Repository } from 'typeorm';
import { Public } from '@/auth/decorators/public.decorator';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
@ApiTags('Chat')
@Controller('chat')
export class ChatController {

  constructor(

    private configService: ConfigService,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private readonly chatService: ChatService,

  ) {

  }



  @Post('message')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'files', maxCount: 10 },
      ],
      {
        // Optional: Add file size and type restrictions
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB per file
        },
        fileFilter: (req, file, cb) => {
          // Allow specific file types (adjust as needed)
          const allowedTypes = [
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/jpg'
          ];

          if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error(`File type ${file.mimetype} not allowed`), false);
          }
        },
      }
    )
  )
  async sendMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Res() res: Response,
    @Req() req: any,
    @UploadedFiles() files: { files?: multer.File[] },
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('X-Accel-Buffering', 'no');

    let clientDisconnected = false;

    req.on('close', () => {
      clientDisconnected = true;
      console.log('Client disconnected');
    });

    let fullAiResponse = '';
    let sentMetadata = false;
    let streamData: any = null;


    try {

      // --- Regenerate logic: delete most recent assistant message if needed ---
      if (createMessageDto.regenerate && createMessageDto.conversationId) {
        try {
          // Find the most recent assistant message in this conversation
          const lastAssistantMsg = await this.messageRepository.findOne({
            where: { conversationId: createMessageDto.conversationId,  },
            order: { createdAt: 'DESC' },
          });
          if (lastAssistantMsg) {
            console.log('Regenerating message, deleting most recent assistant message with ID:', lastAssistantMsg.id);
            await this.messageRepository.delete({ id: lastAssistantMsg.id });
          } else {
            console.log('No assistant message found to delete for conversation:', createMessageDto.conversationId);
          }
        } catch (deleteError) {
          console.error('Error deleting most recent assistant message:', deleteError);
        }
      }

      const result = await this.chatService.sendMessage(createMessageDto, req, files?.files || []);
      streamData = result;
      // const stream = await result.model.stream([new HumanMessage(result.prompt)]);

      for await (const chunk of result.stream) {
        if (clientDisconnected || res.destroyed) {
          console.log('Response destroyed or client disconnected, stopping stream');
          break;
        }

        let token = '';
        // if(typeof chunk.content === 'string' &&  chunk.content.includes('I did not have knowledge about that.')) {
        //   result.documentContext = ''
        //   console.log('No relevant documents found, skipping document context');
        // }
        if (typeof chunk.content === 'string') {
          token = chunk.content;
        } else if (Array.isArray(chunk.content)) {
          token = chunk.content
            .map((part: any) => typeof part.text === 'string' ? part.text : '')
            .join('');
        }
        // const event = { token };
        // res.write(`data: ${JSON.stringify(event)}\n\n`);

        if (!sentMetadata) {
          const event = {
            conversationId: result.conversationId,
            userId: result.userId,
            title: result.title,
            token,
            filesProcessed: files?.files?.length || 0
          };
          res.write(`data: ${JSON.stringify(event)}\n\n`);
          sentMetadata = true;

        } else {
          const event = { token };
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        }

        // Flush the response to send data immediately
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }

        fullAiResponse += token;
      }
       if(fullAiResponse.includes('I did not have knowledge about that.')) {
        result.documentContext = '';
        console.log('removing the document context beacause no response was found');
      }

       if (!clientDisconnected && !res.destroyed && result.documentContext) {
        const citationTokens = [
          "\n\n **Citation** : ",
          result.documentContext
        ];
        
        for (const citationToken of citationTokens) {
          if (clientDisconnected || res.destroyed) break;
          
          const event = { token: citationToken };
          res.write(`data: ${JSON.stringify(event)}\n\n`);
          
          if (typeof (res as any).flush === 'function') {
            (res as any).flush();
          }
          
          fullAiResponse += citationToken;
        }
      }
     

      // Send final "done" event if no client disconnection
      if (!clientDisconnected && !res.destroyed) {
        res.write(`data: ${JSON.stringify({ done: true , documentContext : result.documentContext })}\n\n`);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      }

      // Save message to database after streaming is complete
      try {
        await this.chatService.saveMessage(
          createMessageDto.message,
          fullAiResponse,
          streamData.title,
          streamData.userId,
          streamData.conversationId,
          result.filename || '',
          result.size || '',
          result.type || '',
          result.fileContent || ''
        );
      } catch (saveError) {
        console.error('Error saving message:', saveError);
        if (!clientDisconnected && !res.destroyed) {
          res.write(`data: ${JSON.stringify({ error: 'Failed to save message' })}\n\n`);
        }
      }

    } catch (error) {
      console.error('Streaming error:', error);
      let errorMessage = 'Failed to process your message.';
      if (error.message?.includes('invalid_api_key')) {
        errorMessage = 'OpenAI API authentication failed';
      } else if (error.message?.includes('rate_limit_exceeded') || error.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.message?.includes('content_policy_violation')) {
        errorMessage = 'Content was blocked by OpenAI filters.';
      } else if (error.message?.includes('File type') && error.message?.includes('not allowed')) {
        errorMessage = error.message;
      }
      if (!clientDisconnected && !res.destroyed) {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      }
    } finally {
      if (!clientDisconnected && !res.destroyed) {
        res.end();
      }
    }
  }

  async getMessagesByConversation(conversationId: string, userId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }



  @Get('user-conversations')
  async getUserConversations(
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    console.log(userId)
    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const conversations = await this.chatService.getUniqueConversationsByUser(userId);

    res.json({ success: true, conversations });
  }

  @Get('get-suggestions')
  async getSugggestions(
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    console.log(userId)
    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const suggestions = await this.chatService.getSuggetions();

    res.json({ success: true, suggestions });
  }


  @Post('create-conversation')
  async createConversation(
    @Param('conversationId') conversationId: string,
    @Body() createMessageDto: CreateMessageDto,
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.id;

    // if (!conversationId) {
    //   res.status(400).json({ success: false, message: 'conversationId is required' });
    //   return;
    // }

    if (!createMessageDto?.message) {
      res.status(400).json({ success: false, message: 'message is required' });
      return;
    }

    const messages = await this.chatService.createNewConversation(
      createMessageDto.message
    );

    res.json({ success: true, messages });
  }

  @Get('conversation/:conversationId')
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.id;

    if (!conversationId && !userId) {
      res.status(400).json({ success: false, message: 'conversationId and userId are required' });
      return;
    }

    const messages = await this.chatService.getMessagesByConversation(conversationId, String(userId));
    res.json({ success: true, messages });
  }


}