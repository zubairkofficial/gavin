import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import {
  ChatResponseDto,
  MessagesListResponseDto,
  MessageResponseDto,
} from './dto/message-response.dto';
import { Public } from '@/auth/decorators/public.decorator';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Public()
  @Post('message')
    async sendMessage(@Body() createMessageDto: CreateMessageDto): Promise<any> {
    console.log('Received request body:', createMessageDto);
    const result = await this.chatService.sendMessage(createMessageDto);

    return {
      success: true,
      data: {
        message: result.message,
        conversationId: result.conversationId,
        isComplete: ''
      },
    };
  }

  @Public()
  @Get('history')
  @ApiOperation({ summary: 'Get conversation history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Conversation history retrieved successfully',
    
  })
  async getHistory(@Query() getMessagesDto: GetMessagesDto): Promise<any> {
    const result = await this.chatService.getMessages(getMessagesDto);
    
    return {
      success: true,
      data: result.messages.map(msg => ({
        id: msg.id,
        userMessage: msg.userMessage,
        aiResponse: msg.aiResponse,
        userId: msg.userId,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      })),
      pagination: {
        limit: 50,
        offset: 0,
        total: result.total,
      },
    };
  }

  @Public()
  @Get('history/:userId')
  @ApiOperation({ summary: 'Get conversation history for specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'User conversation history retrieved successfully',
    type: MessagesListResponseDto,
  })
  async getUserHistory(
    @Param('userId') userId: string,
    @Query() getMessagesDto: GetMessagesDto,
  ): Promise<MessagesListResponseDto> {
    const result = await this.chatService.getUserMessages(userId, getMessagesDto);
    
    return {
      success: true,
      data: result.messages.map(msg => ({
        id: msg.id,
        userMessage: msg.userMessage,
        aiResponse: msg.aiResponse,
        userId: msg.userId,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      })),
      pagination: {
        limit: 50,
        offset: 0,
        total: result.total,
      },
    };
  }

  @Public()
  @Get('message/:id')
  @ApiOperation({ summary: 'Get specific message by ID' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({
    status: 200,
    description: 'Message retrieved successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
  })
  async getMessage(@Param('id', ParseIntPipe) id: number): Promise<{
    success: boolean;
    data: MessageResponseDto;
  }> {
    const message = await this.chatService.getMessageById(id);
    
    return {
      success: true,
      data: {
        id: message.id,
        userMessage: message.userMessage,
        aiResponse: message.aiResponse,
        userId: message.userId,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      },
    };
  }
}