import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private gemini: GenerativeModel;

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('gemini.apiKey');
    if (!apiKey) {
      this.logger.warn('Gemini API key not configured');
    } else {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.gemini = genAI.getGenerativeModel({
        model: this.configService.get<string>('gemini.model') ?? 'gemini-pro',
        generationConfig: {
          maxOutputTokens: this.configService.get<number>('gemini.maxOutputTokens'),
          temperature: this.configService.get<number>('gemini.temperature'),
          topP: this.configService.get<number>('gemini.topP'),
          topK: this.configService.get<number>('gemini.topK'),
        },
      });
    }
  }

  async sendMessage(createMessageDto: CreateMessageDto): Promise<{
  message: Message;
  usage?: any;
}> {
  try {
    const { message, userId } = createMessageDto;
    console.log(message)

    // Validate message and userId
    if (!message) {
      throw new BadRequestException('Message cannot be empty');
    }

    if (!userId?.trim()) {
      throw new BadRequestException('UserId is required');
    }

    if (!this.gemini) {
      throw new InternalServerErrorException('Gemini API not configured');
    }

    // Trim the message
    const trimmedMessage = message.trim();

    // Rest of your existing code...
    const conversationHistory = await this.getConversationHistory(userId, 5);

    // Update context prompt with trimmed message
    let contextPrompt = 'You are a helpful AI assistant. Provide clear, concise, and helpful responses.\n\n';
    
    if (conversationHistory.length > 0) {
      contextPrompt += 'Previous conversation:\n';
      conversationHistory.forEach((msg) => {
        contextPrompt += `User: ${msg.userMessage}\n`;
        contextPrompt += `Assistant: ${msg.aiResponse}\n\n`;
      });
    }

    contextPrompt += `Current message:\nUser: ${trimmedMessage}\nAssistant:`;

    // Call Gemini API
    const result = await this.gemini.generateContent(contextPrompt);
    const response = await result.response;
    const aiResponse = response.text();

    // Save with trimmed values
    const savedMessage = await this.messageRepository.save({
      userMessage: trimmedMessage,
      aiResponse: aiResponse || "",
      userId: userId.trim(),
    });

      // Extract usage information if available
      const usage = response.usageMetadata ? {
        promptTokens: response.usageMetadata.promptTokenCount,
        completionTokens: response.usageMetadata.candidatesTokenCount,
        totalTokens: response.usageMetadata.totalTokenCount,
      } : undefined;

      return {
        message: savedMessage,
        usage,
      };
    } catch (error) {
      this.logger.error('Error in sendMessage:', error);

      // Handle Gemini-specific errors
      if (error.message?.includes('API_KEY_INVALID')) {
        throw new InternalServerErrorException('Gemini API authentication failed');
      }

      if (error.message?.includes('RATE_LIMIT_EXCEEDED') || error.status === 429) {
        throw new BadRequestException('Rate limit exceeded. Please try again later.');
      }

      if (error.message?.includes('SAFETY')) {
        throw new BadRequestException('Content was blocked by safety filters. Please modify your message.');
      }

      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to process your message. Please try again.');
    }
  }

  async getMessages(getMessagesDto: GetMessagesDto): Promise<{
    messages: Message[];
    total: number;
  }> {
    try {
      const { limit, offset } = getMessagesDto;

      const [messages, total] = await this.messageRepository.findAndCount({
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });

      return { messages, total };
    } catch (error) {
      this.logger.error('Error in getMessages:', error);
      throw new InternalServerErrorException('Failed to fetch messages');
    }
  }

  async getUserMessages(userId: string, getMessagesDto: GetMessagesDto): Promise<{
    messages: Message[];
    total: number;
  }> {
    try {
      const { limit, offset } = getMessagesDto;

      const [messages, total] = await this.messageRepository.findAndCount({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });

      return { messages, total };
    } catch (error) {
      this.logger.error('Error in getUserMessages:', error);
      throw new InternalServerErrorException('Failed to fetch user messages');
    }
  }

  async getMessageById(id: number): Promise<Message> {
    try {
      const message = await this.messageRepository.findOne({ where: { id } });

      if (!message) {
        throw new BadRequestException('Message not found');
      }

      return message;
    } catch (error) {
      this.logger.error('Error in getMessageById:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch message');
    }
  }

  async getConversationHistory(userId?: string, limit = 10): Promise<Message[]> {
    try {
      const queryBuilder = this.messageRepository
        .createQueryBuilder('message')
        .orderBy('message.createdAt', 'ASC')
        .limit(limit);

      if (userId) {
        queryBuilder.where('message.userId = :userId', { userId });
      }

      return await queryBuilder.getMany();
    } catch (error) {
      this.logger.error('Error in getConversationHistory:', error);
      return [];
    }
  }

  async healthCheck(): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
    services: {
      database: string;
      gemini: string;
    };
  }> {
    try {
      // Test database connection
      await this.messageRepository.findOne({ where: {} });

      return {
        success: true,
        message: 'Chat service is healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          gemini: this.gemini ? 'configured' : 'not configured',
        },
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      
      return {
        success: false,
        message: 'Service health check failed',
        timestamp: new Date().toISOString(),
        services: {
          database: 'error',
          gemini: this.gemini ? 'configured' : 'not configured',
        },
      };
    }
  }
}