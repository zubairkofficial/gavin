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
// import { getTokenCount } from "@langchain/core/utils/tiktoken";
import { MssqlParameter, Repository } from 'typeorm';
import { Public } from '@/auth/decorators/public.decorator';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { Configuration } from '@/documents/entities/configuration.entity';
import { User } from '@/auth/entities/user.entity';
@ApiTags('Chat')
@Controller('chat')
export class ChatController {

  constructor(

    private configService: ConfigService,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private readonly chatService: ChatService,

    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Configuration)
    private configurationRepository: Repository<Configuration>
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
      let upadtedMessageId
      // console.log('Received regenerate request for message', createMessageDto.assistantMsgId);
      // console.log('Received regenerate request for conversation', createMessageDto.conversationId);
      // --- Regenerate logic: delete most recent assistant message if needed ---
      if (createMessageDto.regenerate && createMessageDto.conversationId) {
        try {
          // Find the most recent assistant message in this conversation
          const lastAssistantMsg = await this.messageRepository.findOne({
            where: { conversationId: createMessageDto.conversationId, id: createMessageDto.assistantMsgId },
            order: { createdAt: 'DESC' },
          });
          if (lastAssistantMsg) {
            // console.log('Regenerating message, deleting most recent assistant message with ID:', lastAssistantMsg.id);
            // console.log('Using websearch value:', createMessageDto.websearch);
            // await this.messageRepository.delete({ id: lastAssistantMsg.id });
            upadtedMessageId = lastAssistantMsg.id
            // console.log('Deleting most recent assistant message:', lastAssistantMsg.id, 'the whole data ', lastAssistantMsg);
          } else {
            console.log('No assistant message found to delete for conversation:', createMessageDto.conversationId);
          }
        } catch (deleteError) {
          console.error('Error deleting most recent assistant message:', deleteError);
        }
      }

      // console.log('web search that is using in the controller',createMessageDto.websearch)

      const result = await this.chatService.sendMessage(createMessageDto, req, files?.files || []);
      streamData = result;
      console.log('web search that is using in the controller', createMessageDto.websearch);
      // console.log('Result from chatService:', result);

      const user = await this.usersRepository.findOne({
        where: { id: req.user.id },
        select: ['id', 'credits'],
      })

      const currentCredits = user?.credits || 0;

      const config = await this.configurationRepository.find()
      let cutTokens
      if (config) {
        cutTokens = config[0]?.cutCredits
      }


      if (createMessageDto.websearch == 'false') {
        let chunks 
        for await (const chunk of result.stream) {
          if (clientDisconnected || res.destroyed) {
            console.log('Response destroyed or client disconnected, stopping stream');
            break;
          }

          chunks = chunk
          let token = '';
 
          if (typeof chunk.content === 'string') {
            token = chunk.content;

            // console.log('anotation:' , chunk)
          } else if (Array.isArray(chunk.content)) {
            token = chunk.content
              .map((part: any) => typeof part.text === 'string' ? part.text : '')
              .join('');
          }


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




          // ----------------- Handle token usage and credit deduction-----------------
          
          
        }
        let finalChunk: any = null;
        if (chunks?.usage_metadata?.total_tokens) {
          finalChunk = chunks;
        }


        // const outputTokenCount = finalChunk?.usage_metadata?.total_tokens

        const outputTokenCount =  finalChunk?.usage_metadata?.total_tokens
        || result.stream.usage_metadata?.total_tokens;

        console.log('outputcreditCount:', outputTokenCount);

        let rounded = ((outputTokenCount * 1) / cutTokens)

        let totalCredits = Math.round(rounded);
        console.log('rounded credits:', totalCredits);

        const finaltoken = currentCredits - totalCredits

        const re = await this.usersRepository.update(
          { id: req.user.id },
          { credits: finaltoken }
        );

        // console.log('Updated user credits:', re);

        // ------------------------- End of token usage and credit deduction-----------------



        if (fullAiResponse.includes('I did not have knowledge about that.')) {
          result.documentContext = [];
          // console.log('removing the document context beacause no response was found');
        }

        if (!clientDisconnected && !res.destroyed && result.documentContext) {
          // 1. Send the citation label as a chunk
          const citationLabel = "";
          res.write(`data: ${JSON.stringify({ token: citationLabel })}\n\n`);
          if (typeof (res as any).flush === 'function') {
            (res as any).flush();
          }
          fullAiResponse += citationLabel;
          // console.log(`\n\n Citation00 : --${JSON.stringify(result.documentContext)}`)
          // console.log(`\n\n Citation00 : --${(result.documentContext)}`)

          // 2. Wrap document context in <citation> and send as JSON
          const citationJson = `\n\n Citation00 : --${JSON.stringify(result.documentContext)}`;
          res.write(`data: ${JSON.stringify({ token: citationJson })}\n\n`);
          if (typeof (res as any).flush === 'function') {
            (res as any).flush();
          }
          fullAiResponse += citationJson;
        }

        

        let messageId
        if (createMessageDto.regenerate && upadtedMessageId) {
          let msgcontent
          try {
            const msg = await this.chatService.updateMessage(
              upadtedMessageId, // Use the existing message ID for update
              {
                humanMessage: createMessageDto.message,
                aiMessage: fullAiResponse,
                title: streamData.title,
                userId: streamData.userId,
                conversationId: streamData.conversationId,
                filename: result.filename || '',
                size: result.size || '',
                type: result.type || '',
                fileContent: result.fileContent || ''
              }
            );
            console.log('Message updated successfully', msg);
            msgcontent = msg;
          } catch (updateError) {
            console.error('Error updating message:', updateError);
            if (!clientDisconnected && !res.destroyed) {
              res.write(`data: ${JSON.stringify({ error: 'Failed to update message' })}\n\n`);
            }
          }
        } else {
          let msgcontent
          try {
            const msg = await this.chatService.saveMessage(
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
            console.log('Message saved successfull ', msg)
            msgcontent = msg
          } catch (saveError) {
            console.error('Error saving message:', saveError);
            if (!clientDisconnected && !res.destroyed) {
              res.write(`data: ${JSON.stringify({ error: 'Failed to save message' })}\n\n`);
            }
          }
          messageId = msgcontent.id
          console.log('Message saved successfully:', msgcontent);
        }


        // Send final "done" event if no client disconnection
        if (!clientDisconnected && !res.destroyed) {
          res.write(`data: ${JSON.stringify({ done: true, documentContext: result.documentContext, messageid: messageId })}\n\n`);
          console.log(`data: ${JSON.stringify({ done: true, documentContext: result.documentContext })}\n\n`);
          if (typeof (res as any).flush === 'function') {
            (res as any).flush();
          }
        }
      } else {
        if (clientDisconnected || res.destroyed) {
          console.log('Response destroyed or client disconnected');
          return;
        }

        console.log('token usage for the message of web search  is', result.stream.usage_metadata?.total_tokens);
        const outputTokenCount = result.stream.usage_metadata?.total_tokens

        console.log('outputcreditCount:', outputTokenCount);

        let rounded = ((outputTokenCount * 1) / cutTokens)

        let totalCredits = Math.round(rounded);
        console.log('rounded credits:', totalCredits);

        const finaltoken = currentCredits - totalCredits

        const re = await this.usersRepository.update(
          { id: req.user.id },
          { credits: finaltoken }
        );

        console.log('Updated user credits:', re);
        console.log('total tokens used:', result.stream.usage_metadata?.total_tokens
        )

        // console.log(result.stream.content)

        // Send initial metadata with the content
        const initialEvent = {
          conversationId: result.conversationId,
          userId: result.userId,
          title: result.title,
          token: Array.isArray(result.stream.content)
            ? result.stream.content.map(item => item.text).join('')
            : (result.stream.content?.text?.toString() || ''),

          filesProcessed: files?.files?.length || 0
        };
        // console.log('initialEvent', initialEvent),
        res.write(`data: ${JSON.stringify(initialEvent)}\n\n`);

        // Add the content to full response
        fullAiResponse = Array.isArray(result.stream.content)
          ? result.stream.content.map(item => item.text).join('')
          : (typeof result.stream.content === 'string'
            ? result.stream.content
            : result.stream.content?.toString() || '');        // console.log)

        // Handle annotations if they exist
        // if (result.documentContext && result.documentContext.length > 0) {
        //   const citationJson = `\n\n Citation00 : --${JSON.stringify(result.annotations)}`;
        //   res.write(`data: ${JSON.stringify({ token: citationJson })}\n\n`);
        //   fullAiResponse += citationJson;
        // }
        if (result.annotations && result.annotations.length > 0) {
          const citationJson = `\n\n annotations : --${JSON.stringify(result.annotations)}`;
          res.write(`data: ${JSON.stringify({ token: citationJson })}\n\n`);
          fullAiResponse += citationJson;
        }

        let messageId
        if (createMessageDto.regenerate && upadtedMessageId) {
          let msgcontent
          try {
            const msg = await this.chatService.updateMessage(
              upadtedMessageId, // Use the existing message ID for update
              {
                humanMessage: createMessageDto.message,
                aiMessage: fullAiResponse,
                title: streamData.title,
                userId: streamData.userId,
                conversationId: streamData.conversationId,
                filename: result.filename || '',
                size: result.size || '',
                type: result.type || '',
                fileContent: result.fileContent || ''
              }
            );
            console.log('Message updated successfully', msg);
            msgcontent = msg;
          } catch (updateError) {
            console.error('Error updating message:', updateError);
            if (!clientDisconnected && !res.destroyed) {
              res.write(`data: ${JSON.stringify({ error: 'Failed to update message' })}\n\n`);
            }
          }
        } else {
          let msgcontent
          try {
            const msg = await this.chatService.saveMessage(
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
            console.log('Message saved successfull ', msg)
            msgcontent = msg
          } catch (saveError) {
            console.error('Error saving message:', saveError);
            if (!clientDisconnected && !res.destroyed) {
              res.write(`data: ${JSON.stringify({ error: 'Failed to save message' })}\n\n`);
            }
          }
          messageId = msgcontent.id
          console.log('Message saved successfully:', msgcontent);
        }


        


        // Send final done event
        if (!clientDisconnected && !res.destroyed) {
          res.write(`data: ${JSON.stringify({
            done: true,
            documentContext: result.documentContext,
            finalContent: fullAiResponse,
            messageId: messageId,
          })}\n\n`);
          if (typeof (res as any).flush === 'function') {
            (res as any).flush();
          }
        }
      }


      // Save message to database after streaming is complete
      // try {
      //   await this.chatService.saveMessage(
      //     createMessageDto.message,
      //     fullAiResponse,
      //     streamData.title,
      //     streamData.userId,
      //     streamData.conversationId,
      //     result.filename || '',
      //     result.size || '',
      //     result.type || '',
      //     result.fileContent || ''
      //   );
      // } catch (saveError) {
      //   console.error('Error saving message:', saveError);
      //   if (!clientDisconnected && !res.destroyed) {
      //     res.write(`data: ${JSON.stringify({ error: 'Failed to save message' })}\n\n`);
      //   }
      // }

    } catch (error) {
      console.error('Streaming error:', error);
      let errorMessage = 'Failed to process your message.';
      if (error.message?.includes('You have low credits, please Add credits')) {
        errorMessage = 'You have low credits, please Add credits';
      } else if (error.message?.includes('invalid_api_key')) {
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

  @Get('trash')
  async getTrashConversations(
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.id;

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    try {
      const trashedConversations = await this.chatService.getDeletedConversationsByUser(userId);
      res.json({ success: true, conversations: trashedConversations });
      console.log('Fetched deleted conversations:', trashedConversations);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch deleted conversations' });
    }
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

  @Post('restore/:conversationId')
  async restoreConversation(
    @Param('conversationId') conversationId: string,
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.id;

    if (!conversationId) {
      res.status(400).json({ success: false, message: 'Conversation ID is required' });
      return;
    }

    try {
      await this.chatService.restoreConversation(conversationId, userId);
      res.json({ success: true, message: 'Conversation restored successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to restore conversation' });
    }
  }

  @Post('permanent-delete/:conversationId')
  async permanatDelConversation(
    @Param('conversationId') conversationId: string,
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.id;

    if (!conversationId) {
      res.status(400).json({ success: false, message: 'Conversation ID is required' });
      return;
    }

    try {
      await this.chatService.permnatDelConversation(conversationId, userId);
      res.json({ success: true, message: 'Conversation deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete conversation' });
    }
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

  @Post('update-title/:conversationId')
  async updateConversationTitle(
    @Param('conversationId') conversationId: string,
    @Body() body: { title: string },
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.id;

    if (!conversationId || !body.title) {
      res.status(400).json({ success: false, message: 'Conversation ID and title are required' });
      return;
    }

    try {
      await this.chatService.updateConversationTitle(conversationId, body.title, userId);
      res.json({ success: true, message: 'Title updated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update conversation title' });
    }
  }

  @Post('delete/:conversationId')
  async deleteConversation(
    @Param('conversationId') conversationId: string,
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.id;

    if (!conversationId) {
      res.status(400).json({ success: false, message: 'Conversation ID is required' });
      return;
    }

    try {
      await this.chatService.deleteConversation(conversationId, userId);
      res.json({ success: true, message: 'Conversation deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete conversation' });
    }
  }


  @Post('add-credits')
  async addCredits(@Req() req,
    @Body() body: { credits: number },) {
    const userId = req.user?.id;
    const credits = body.credits;

    console.log('creadits recived', body)

    return await this.chatService.addCredits(userId, credits);
  }

  @Post('manage-credits')
  async manageCredits(@Body() body: { cutCreditsPerToken: number, minimumCreditsToSend: number }) {
    const minmessage = body.minimumCreditsToSend;
    const cutcredits = body.cutCreditsPerToken;


    return await this.chatService.manageCredits(minmessage, cutcredits);
  }

  @Get('get-credits')
  async getCredits() {

    return await this.chatService.getCredits();
  }



}