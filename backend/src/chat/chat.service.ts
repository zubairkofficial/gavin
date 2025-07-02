import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { VectorStoreRetriever } from '@langchain/core/vectorstores';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { v4 as uuidv4 } from 'uuid';

const hotName = process.env.DB_HOST;
const portNu = parseInt(process.env.DB_PORT || '5432');
const duser = process.env.DB_USERNAME;
const pass = process.env.DB_PASSWORD;
const data = process.env.DB_DATABASE;

const PG_CONFIG = {
  postgresConnectionOptions: {
    type: 'postgres' as const,
    host: hotName,
    port: portNu,
    user: duser,
    password: pass,
    database: data,
    ssl: {
          rejectUnauthorized: false,
          ca: `-----BEGIN CERTIFICATE-----
MIIEUDCCArigAwIBAgIUFMY7g/gl96OaxPd/8S2wnI/bavYwDQYJKoZIhvcNAQEM
BQAwQDE+MDwGA1UEAww1NzYyNzYwOWYtOGI5NC00YTNkLTg1OTItZTliZWZhYTJj
ZmNlIEdFTiAxIFByb2plY3QgQ0EwHhcNMjUwNjE3MTIyMTQxWhcNMzUwNjE1MTIy
MTQxWjBAMT4wPAYDVQQDDDU3NjI3NjA5Zi04Yjk0LTRhM2QtODU5Mi1lOWJlZmFh
MmNmY2UgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC
AYoCggGBAN6G/DqFjk79qSzLlo3rAQHZMKWYTQYBUf3sGnZGkdtD/SaETn2QNHvR
eEXUG7BKIqoz8ruczkij90YAiH/cSOdL0bS9rfZB2/lMy1oUMGjgrtdAS8X7nTPP
7zthy6EOzMfmb+WXtXzfXXUUvhlVKRO1MNecYp6PWGZTKRwwQeGvWPMVBruyvkgs
V/Se70WU6XZ3YJtj/+7f8548KliDnxPNBDo27A7AflXVpj4X7uTXV4fXu5WL1s5m
eQOBoYRoY1kbcf/OQyoaZCe13HbulIkpqrzpQ4EKNG7zOf3TlDovlYlKpAHA9uvm
y4vlYLjaTMH6B34WFdVBpRcJPahgyD3axvqHShdyXgQEKt1r70Sgvm0D1CV2nQqA
W0YUajfr+QrK89eqXnXyU43XL1ulhrtNjl4bcSOAJDVR3CjwHVI95ZJcGL5+m/5K
9AmNVIRfpO/p569fG46HwP2cy4xmBfcZOjw7XMbmdXtVnd2y9kjos7/yZkJ1lgTT
UBuUxwxJPwIDAQABo0IwQDAdBgNVHQ4EFgQUKIGjJLXwW23PrJ2chOGPWRg+4z8w
EgYDVR0TAQH/BAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQAD
ggGBABRAzDjsF2+hzYgUfZncheqBIlXuP3eOcPav838fsgCMUeQNq/2QovWHpIP5
k8g2BwIXhdhZqOn4WIYWIQ8T1UwmE3gLic64rfUPkeOOJx10BHpkqCawW1AuFfQV
9LQH/GCQd78xtbvvgoDX0DTGFBJ8j/UeWhuNZtC/Gaw0vMeJ7x2pljdfsCyby0Rp
h4NqO2k6j8optr5WkH47UrP6fiB6mUbFBwm6OAvUhTRF61uPXUkUaYQch8oIQwW4
0Ij4aU95p3WToSfBdOXiHQKgrqthQvKwJZKnWfnH1w3VQT39uzPADm7+jLw06rpX
IeR/weWk5kPQas3jaN0hIEsV/TyjpOPqRlIpkvXCtJXuB1U3Ha0hh9FcF/Qccky5
RLIg/EqouWzVfgqoHejsgLX/lfweRYOYjXcsG1/OSgLDkVIrimkLxRpLKjs+QHlK
Bl8yI+HhlS1hA9AsVfY8DRpssIUszmmXpJBGYdcN5qDkZx6Rv811RcVUhaRHak3X
OL/0OA==
-----END CERTIFICATE-----
`}

  },
  tableName: "document_embeddings",
  columns: {
    idColumnName: "id",
    vectorColumnName: "embedding",
    contentColumnName: "content",
    metadataColumnName: "metadata",
  },
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private model: ChatOpenAI;
  private vectorStore: PGVectorStore;
  private embeddings: OpenAIEmbeddings;
  private retriever: VectorStoreRetriever<PGVectorStore>;

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private configService: ConfigService,
  ) {
    const openAiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    console.log('OpenAI API Key configured:', !!openAiApiKey);
    
    if (!openAiApiKey) {
      this.logger.warn('OpenAI API key not configured');
    } else {
      this.model = new ChatOpenAI({
        temperature: 0.7,
        openAIApiKey: openAiApiKey,
        modelName: 'gpt-4',
      });

      // Initialize embeddings
      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey: openAiApiKey,
        modelName: "text-embedding-3-small",
      });

      // Initialize vector store
      this.initializeVectorStore();
    }
  }

  private async initializeVectorStore() {
    try {
      this.vectorStore = await PGVectorStore.initialize(
        this.embeddings,
        PG_CONFIG
      );
      
      // Initialize retriever with the vector store
      this.retriever = this.vectorStore.asRetriever({
        k: 4, // Number of documents to retrieve
        searchType: "similarity",
        // searchKwargs: {
          
        // }
      });
      
      this.logger.log('Vector store and retriever initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize vector store:', error);
    }
  }

  /**
   * Add documents to the vector store for RAG
   */
  async addDocuments(documents: Document[]): Promise<void> {
    try {
      if (!this.vectorStore) {
        throw new InternalServerErrorException('Vector store not initialized');
      }

      await this.vectorStore.addDocuments(documents);
      this.logger.log(`Added ${documents.length} documents to vector store`);
    } catch (error) {
      this.logger.error('Error adding documents:', error);
      throw new InternalServerErrorException('Failed to add documents to vector store');
    }
  }

  /**
   * Add text content to vector store
   */
  async addTextContent(texts: string[], metadatas?: Record<string, any>[]): Promise<void> {
    try {
      if (!this.vectorStore) {
        throw new InternalServerErrorException('Vector store not initialized');
      }

      const documents = texts.map((text, idx) => new Document({
        pageContent: text,
        metadata: metadatas && metadatas[idx] ? metadatas[idx] : {},
      }));
      
      await this.vectorStore.addDocuments(documents);
      this.logger.log(`Added ${texts.length} texts to vector store`);
    } catch (error) {
      this.logger.error('Error adding texts:', error);
      throw new InternalServerErrorException('Failed to add texts to vector store');
    }
  }

  /**
   * Perform similarity search using retriever for RAG
   */
  private async performRAGSearch(query: string): Promise<Document[]> {
    try {
      if (!this.retriever) {
        this.logger.warn('Retriever not available, proceeding without RAG');
        return [];
      }

      const results = await this.retriever.getRelevantDocuments(query);
      this.logger.log(`Retrieved ${results.length} relevant documents for query`);
      return results;
    } catch (error) {
      this.logger.error('Error in RAG search:', error);
      return [];
    }
  }

  /**
   * Alternative similarity search method
   */
  private async performSimilaritySearch(query: string, k: number = 4): Promise<Document[]> {
    try {
      if (!this.vectorStore) {
        this.logger.warn('Vector store not available, proceeding without RAG');
        return [];
      }

      const results = await this.vectorStore.similaritySearch(query, k);
      this.logger.log(`Found ${results.length} relevant documents for similarity search`);
      return results;
    } catch (error) {
      this.logger.error('Error in similarity search:', error);
      return [];
    }
  }

  /**
   * Build context from retrieved documents
   */
  private buildContext(documents: Document[]): string {
    if (documents.length === 0) {
      return '';
    }

    const context = this.vectorStore.asRetriever()

    return `Context Information:\n${context}\n\n`;
  }

  /**
   * Get conversation history for context
   */
  private async getConversationContext(conversationId: string, limit: number = 5): Promise<string> {
    try {
      const messages = await this.messageRepository.find({
        where: { conversationId },
        order: { createdAt: 'DESC' },
        take: limit,
      });

      if (messages.length === 0) {
        return '';
      }

      const context = messages
        .reverse() // Show chronological order
        // .map(msg => `${msg.role}: ${msg.message}`)
        .join('\n');

      return `Previous conversation:\n${context}\n\n`;
    } catch (error) {
      this.logger.error('Error getting conversation context:', error);
      return '';
    }
  }

  async sendMessage(createMessageDto: CreateMessageDto): Promise<{
    message: any;
    conversationId: any;
  }> {
    try {
      const { message, conversationId } = createMessageDto;

      if (!message) {
        throw new BadRequestException('Message cannot be empty');
      }

      const conId = conversationId || uuidv4();

      // Perform RAG search to get relevant documents using retriever
      const relevantDocs = await this.performRAGSearch(message);
      
      // Build context from retrieved documents
      const ragContext = this.buildContext(relevantDocs);
      
      // Get conversation history for additional context
      const conversationContext = conversationId ? 
        await this.getConversationContext(conversationId) : '';

      // Build messages array with context
      const messages: (SystemMessage | HumanMessage | AIMessage)[] = [];

      // Add system message with context if available
      if (ragContext || conversationContext) {
        const systemContent = `You are a helpful assistant. ${
          ragContext ? 
          `Use the following context to answer questions when relevant:\n\n${ragContext}` : 
          ''
        }${
          conversationContext ? 
          `\n${conversationContext}` : 
          ''
        }Please provide accurate and helpful responses based on the context provided, and indicate when you're using the provided context versus general knowledge. If you didn't find relevant content in the provided context, please say "I didn't find an answer in the relevant context."`;
        
        messages.push(new SystemMessage(systemContent));
      }
      
      // Add the current user message
      messages.push(new HumanMessage(message));
      console.log('User message:', message);

      // Save user message to database
      await this.saveMessage({
        content: message,
        role: 'user',
        conversationId: conId,
      });

      // Get AI response
      const response = await this.model.invoke(messages);
      const aiResponse = response.content as string;

      // Save AI response to database
      await this.saveMessage({
        content: aiResponse,
        role: 'assistant',
        conversationId: conId,
      });

      return {
        message: aiResponse,
        conversationId: conId,
      };

    } catch (error) {
      this.logger.error('Error in sendMessage:', error);

      if (error.message?.includes('invalid_api_key')) {
        throw new InternalServerErrorException('OpenAI API authentication failed');
      }

      if (error.message?.includes('rate_limit_exceeded') || error.status === 429) {
        throw new BadRequestException('Rate limit exceeded. Please try again later.');
      }

      if (error.message?.includes('content_policy_violation')) {
        throw new BadRequestException('Content was blocked by OpenAI filters.');
      }

      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to process your message. Please try again.');
    }
  }

  /**
   * Save message to database
   */
  private async saveMessage(messageData: {
    content: string;
    role: string;
    conversationId: string;
    userId?: string;
  }): Promise<Message | null> {
    try {
      const message = this.messageRepository.create(messageData);
      return await this.messageRepository.save(message);
    } catch (error) {
      this.logger.error('Error saving message:', error);
      // Don't throw error here to avoid breaking the chat flow
      return null;
    }
  }

  async getMessages(getMessagesDto: GetMessagesDto): Promise<{ messages: Message[]; total: number }> {
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

  async getUserMessages(userId: string, getMessagesDto: GetMessagesDto): Promise<{ messages: Message[]; total: number }> {
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

  /**
   * Get messages by conversation ID
   */
  async getConversationMessages(conversationId: string, limit = 50): Promise<Message[]> {
    try {
      return await this.messageRepository.find({
        where: { conversationId },
        order: { createdAt: 'ASC' },
        take: limit,
      });
    } catch (error) {
      this.logger.error('Error getting conversation messages:', error);
      return [];
    }
  }

  /**
   * Search documents in vector store using retriever
   */
  async searchDocuments(query: string, k: number = 5): Promise<Document[]> {
    try {
      if (!this.retriever) {
        throw new InternalServerErrorException('Retriever not initialized');
      }

      // Update retriever configuration for this search
      this.retriever = this.vectorStore.asRetriever({
        k: k,
        searchType: "similarity",
      });

      return await this.retriever.getRelevantDocuments(query);
    } catch (error) {
      this.logger.error('Error searching documents:', error);
      throw new InternalServerErrorException('Failed to search documents');
    }
  }

  /**
   * Alternative search using similarity search directly
   */
  async searchDocumentsSimilarity(query: string, k: number = 5): Promise<Document[]> {
    try {
      if (!this.vectorStore) {
        throw new InternalServerErrorException('Vector store not initialized');
      }

      return await this.vectorStore.similaritySearch(query, k);
    } catch (error) {
      this.logger.error('Error searching documents:', error);
      throw new InternalServerErrorException('Failed to search documents');
    }
  }

  async healthCheck(): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
    services: {
      database: string;
      openai: string;
      vectorStore: string;
      retriever: string;
    };
  }> {
    try {
      await this.messageRepository.findOne({ where: {} });

      return {
        success: true,
        message: 'Chat service is healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          openai: this.model ? 'configured' : 'not configured',
          vectorStore: this.vectorStore ? 'initialized' : 'not initialized',
          retriever: this.retriever ? 'initialized' : 'not initialized',
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
          openai: this.model ? 'configured' : 'not configured',
          vectorStore: this.vectorStore ? 'initialized' : 'not initialized',
          retriever: this.retriever ? 'initialized' : 'not initialized',
        },
      };
    }
  }
}