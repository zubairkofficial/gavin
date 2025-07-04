import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { CreateMessageDto } from './dto/create-message.dto';
import { v4 as uuidv4 } from 'uuid';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Message } from './entities/message.entity';
import { getRepository, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BufferMemory } from 'langchain/memory';
import { filter } from 'compression';
import { Contract } from '@/documents/entities/contract.entity';
import { Regulation } from '@/documents/entities/regulation.entity';
import { Case } from '@/documents/entities/case.entity';
import { Statute } from '@/documents/entities/statute.entity';
import * as multer from 'multer';
import { z } from 'zod';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { createWorker } from 'tesseract.js';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { fi } from 'zod/dist/types/v4/locales';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private model: ChatOpenAI;
  private vectorStore: PGVectorStore;
  @InjectRepository(Message)
  private messageRepository: Repository<Message>;
  @InjectRepository(Contract)
  private contractRepository: Repository<Contract>;
  @InjectRepository(Regulation)
  private regulationRepository: Repository<Regulation>;
  @InjectRepository(Case)
  private caseRepository: Repository<Case>;
  @InjectRepository(Statute)
  private statuteRepository: Repository<Statute>;

  constructor(private configService: ConfigService) {
    const openAiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!openAiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.model = new ChatOpenAI({
      temperature: 0.7,
      openAIApiKey: openAiApiKey,
      modelName: 'gpt-4o-mini',
      streaming: true,
    });

    // Use environment variables for PG config
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
        
      },
      tableName: "document_embeddings",
      columns: {
        idColumnName: "id",
        vectorColumnName: "embedding",
        contentColumnName: "content",
        metadataColumnName: "metadata",
      },
    };

    this.vectorStore = new PGVectorStore(
      new OpenAIEmbeddings({ openAIApiKey: openAiApiKey }),
      PG_CONFIG
    );
  }

  async sendMessage(createMessageDto: CreateMessageDto, req: any, files: multer.File[]): Promise<{
    prompt: any,
    stream: any,
    conversationId: string,
    userId?: string,
    title?: string
    filename: string,
    size: string,
    type: string,
  }> {
    const { message, conversationId, title } = createMessageDto;
    if (!message) throw new BadRequestException('Message cannot be empty');

    console.log(files, 'files in chat service')

    const file = files[0];
    const fileName = file?.originalname;
    const fileSize = file?.size;
    const fileType = file?.mimetype;
    console.log('File details:', {
      fileName,
      fileSize,
      fileType,
    });

    let fileContent = '';
    if (files && files.length > 0) {
      fileContent = await parseUploadedFile(files);
      // You can now use fileContent as needed
      console.log('Extracted file content:', fileContent);
    }




    const convId = conversationId || uuidv4();
    const userId = req.user?.id;

    try {
      // Fetch previous messages for buffer memory
      const previousMessages = await this.messageRepository.find({
        where: { conversationId: convId },
        order: { createdAt: 'ASC' },
      });

      let conTitle = '';

      if (!title || !conversationId) {
        const messages = await this.createNewConversation(createMessageDto.message);
        conTitle = messages.title;
      }

      console.log('Previous messages:', previousMessages);

      // Build chat history string
      let chatHistoryContext = '';
      if (previousMessages.length > 0) {
        chatHistoryContext = previousMessages
          .map(msg => `User: ${msg.userMessage}\nAI: ${msg.aiResponse}`)
          .join('\n');
      }

      const memory = new BufferMemory({
        memoryKey: 'chat_history',
        inputKey: 'input',
        outputKey: 'output',
      });

      console.log('User ID:', userId);

      // Use the vector store as retriever
      let relevantDocs: import('@langchain/core/documents').DocumentInterface<Record<string, any>>[] = [];
      try {
        relevantDocs = await this.vectorStore.similaritySearch(message, 5, {
          filter: { enabled: "true" }
        });
        if (relevantDocs.length > 0) {
          console.log('Relevant docs found:', relevantDocs.length);
        } else {
          console.log('No relevant docs found');
        }
      } catch (err) {
        console.log('Error retrieving relevant docs:', err);
      }

      // Build prompt with context from relevant docs and buffer memory
      let context = '';
      context += fileContent ? `File Content:\n${fileContent}\n` : '';
      let documentContext = '';

      if (chatHistoryContext) {
        context += chatHistoryContext + '\n';
      }

      if (relevantDocs.length > 0) {
        const enabledDocs = relevantDocs;

        for (const doc of enabledDocs) {
          console.log('document id for the current using chunk is ', doc.metadata.document_id);

          try {
            if (doc.metadata.document_type === 'contract') {
              const document = await this.contractRepository
                .createQueryBuilder('c')
                .select([
                  'c.jurisdiction',
                  'c.title',
                  'c.isEnabled',
                ])
                .where('c.id = :id', { id: doc.metadata.document_id })
                .getOne();

              console.log('document that we got on the base of id', document);
              if (document) {
                documentContext += `Contract: ${document.title || 'N/A'} (Jurisdiction: ${document.jurisdiction || 'N/A'})\n`;
              }
            } else if (doc.metadata.document_type === 'regulation') {
              const document = await this.regulationRepository
                .createQueryBuilder('c')
                .select([
                  'c.jurisdiction',
                  'c.title',
                  'c.isEnabled',
                  'c.citation',
                  'c.subject_area',
                  'c.summary',
                ])
                .where('c.id = :id', { id: doc.metadata.document_id })
                .getOne();

              if (document) {
                documentContext += `Regulation: ${document.title || 'N/A'} (Citation: ${document.citation || 'N/A'}, Subject: ${document.subject_area || 'N/A'})\n`;
              }
            } else if (doc.metadata.document_type === 'case') {
              const document = await this.caseRepository
                .createQueryBuilder('c')
                .select([
                  'c.jurisdiction',
                  'c.court',
                  'c.decision_date',
                  'c.citation',
                  'c.case_type',
                  'c.holding_summary',
                ])
                .where('c.id = :id', { id: doc.metadata.document_id })
                .getOne();

              if (document) {
                documentContext += `Case: ${document.citation || 'N/A'} (Court: ${document.court || 'N/A'}, Date: ${document.decision_date || 'N/A'})\n`;
              }
            } else if (doc.metadata.document_type === 'statute') {
              const document = await this.statuteRepository
                .createQueryBuilder('c')
                .select([
                  'c.jurisdiction',
                  'c.title',
                  'c.code',
                  'c.section',
                  'c.holding_summary',
                ])
                .where('c.id = :id', { id: doc.metadata.document_id })
                .getRawOne();

              if (document) {
                documentContext += `Statute: ${document.c_title || 'N/A'} (Code: ${document.c_code || 'N/A'}, Section: ${document.c_section || 'N/A'})\n`;
              }
            }
          } catch (docError) {
            console.error(`Error fetching document ${doc.metadata.document_id}:`, docError);
          }
        }

        const disableDocs = relevantDocs.filter(doc => doc.metadata && doc.metadata.status === false);
        console.log('Enabled docs:', enabledDocs.length, 'Disabled docs:', disableDocs.length);

        context += enabledDocs.map(doc => doc.pageContent).join('\n');
      }

      const prompt = context
        ? `Use the following information to answer the question.

        Document Context:
        ${documentContext}

        Instructions:
        - First, try to find the answer **only** from the Document Context above.
        - If you cannot find sufficient information in the Document Context, then refer to the Context below.
        - If you still do not find the answer in either, just say: "I did not have knowledge about that."

        Context:
        ${context}

        Question:
        ${message}
        `
        : `Use the following Document Context to answer the question.

        Document Context:
        ${documentContext}

        Instructions:
        - If you do not find an answer in the Document Context, just say: "I did not have knowledge about that."

        Question:
        ${message}`;

      const stream = await this.model.stream([new HumanMessage(prompt)]);
      const finalTitle = conTitle || title;

      // console.log(stream)

      return {
        stream : stream,
        prompt,
        conversationId: convId,
        userId,
        title: finalTitle,
        filename: fileName,
        size: fileSize,
        type: fileType,
      };

    } catch (error) {
      this.logger.error('Error in sendMessage:', error);
      throw error;
    }
  }


  // Helper method to save message
  async saveMessage(
    message: string,
    aiResponse: string,
    title: string,
    userId: string | undefined,
    conversationId: string,
    filename: string,
    size: string,
    type: string

  ): Promise<void> {
    try {
      const messageEntity = new Message();
      messageEntity.userMessage = message;
      messageEntity.aiResponse = aiResponse;
      messageEntity.title = title;
      messageEntity.userId = userId ? String(userId) : undefined;
      messageEntity.conversationId = conversationId;
      messageEntity.fileName = filename;
      messageEntity.fileSize = size;
      messageEntity.fileType = type;

      await this.messageRepository.save(messageEntity);
      console.log('Message saved successfully');
    } catch (saveError) {
      console.error('Error saving message:', saveError);
      throw saveError;
    }
  }
  async getMessagesByConversation(conversationId: string, userId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { conversationId, userId },
      order: { createdAt: 'ASC' },
    });
  }

  async createNewConversation(
    message: string
  ): Promise<{ title: string }> {


    const completion = await this.model.invoke([
      {
        role: 'system',
        content: `You are a creative storyteller.`
      },
      {
        role: 'user',
        content: `Create a short title of maximum 4 words based on this message: "${message}".`
      }
    ])

    const aiResponse = completion.content;
    console.log(aiResponse)

    // const messages = new Message();
    // messages.conversationId = conId;
    // messages.userMessage = message;
    // // messages.aiResponse = aiResponse

    // await this.messageRepository.save(messages);
    const res = aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse)
    const str = cleanResponseText(aiResponse)
    const data = {
      title: str
    };
    return data;
  }


  async getSuggetions(
  ) {


    const TitleSuggestionSchema = z.object({
      titles: z.array(
        z.string().describe("suggestion prompt")
      ).min(3).max(3)
    })

    const modelWithStructure = this.model.withStructuredOutput(TitleSuggestionSchema);

    const completion = await modelWithStructure.invoke([
      {
        role: 'system',
        content: `
    You are an AI-powered legal assistant designed to assist small law firms and solo practitioners, especially in the field of corporate law. You are integrated with federal and state legal APIs, real-world contracts, and public case law databases. Your primary goal is to help legal professionals by providing citation-aware responses, contract clause suggestions, document review, and answering legal questions in jurisdictions like Delaware, New York, California, and Texas.

    Below are your tasks:

    Legal Q&A: Help users answer legal questions related to corporate law, focusing on corporate governance statutes, federal regulations, and case law.

    Contract Clause Suggestions: Provide suggestions for clauses in legal contracts based on the context.

    Document Review: Review uploaded legal documents and provide summaries or highlight areas of concern.

    Citation-Aware Responses: Ensure all legal answers are backed by relevant legal citations from laws, regulations, or case law.

    Please suggest specific prompts or queries that a user might ask in any of the above areas, which would help improve the legal assistant's functionality and provide a more efficient service to the users.
    `
      },
      {
        role: 'user',
        content: `Generate a list of 3 diverse, creative template suggestions for an AI-powered personal assistant chatbot. The suggestions should align with the features and categories the bot can handle, based on the user's natural language input.`
      }
    ]);

    const aiResponse = completion;
    console.log(completion)
    console.log('AI Response:', aiResponse);
    console.log(aiResponse)
    //  const str =  cleanResponseText(aiResponse)
    const data = {
      title: completion
    };
    return completion;
  }

async getUniqueConversationsByUser(userId: string): Promise<{ conversationId: string; title: string }[]> {
  return this.messageRepository
    .createQueryBuilder('m')
    .select([
      'DISTINCT ON (m.conversationId) m.conversationId AS conversationId',
      'm.title AS title'
    ])
    .where('m.userId = :userId', { userId })
    .andWhere('m.deletedAt IS NULL')
    .orderBy('m.conversationId')           // must match DISTINCT ON
    .addOrderBy('m.createdAt', 'ASC')     // then order by latest message in each conversation
    .getRawMany();
}



}

function cleanResponseText(input: any): string {
  let str = typeof input === 'string' ? input : JSON.stringify(input);

  return str
    .replace(/[\n\r\t]+/g, ' ')      // Replace newlines, carriage returns, tabs with space
    .replace(/"/g, "")              // Replace double quotes with single quotes
    .replace(/\s+/g, ' ')            // Collapse multiple spaces
    .trim();
}

function cleanOCRText(text: string): string {
  let cleaned = text;

  // Remove common OCR artifacts
  cleaned = cleaned
    // Remove mathematical symbols and special characters
    .replace(/[§%\\\/\|\-\+\=\<\>\{\}\[\]]/g, ' ')
    // Remove standalone numbers and letter combinations that don't make sense
    .replace(/\b\d+[a-zA-Z]+\b/g, ' ')
    .replace(/\b[a-zA-Z]+\d+[a-zA-Z]*\b/g, ' ')
    // Remove standalone special characters
    .replace(/[^\w\s\(\)]/g, ' ')
    // Fix common OCR mistakes
    .replace(/\bO\s+(Legged|Wheeled|Hybrid|Hands)\b/g, '• $1') // Convert O to bullet points
    .replace(/\bViL\b/g, '') // Remove OCR artifact
    // Multiple spaces to single space
    .replace(/\s+/g, ' ')
    // Remove very short standalone words (likely OCR errors)
    .replace(/\b[a-zA-Z]\b(?!\s(?:A|I|a))/g, ' ')
    .trim();

  // Extract meaningful phrases and reconstruct
  const words = cleaned.split(/\s+/).filter(word =>
    word.length > 1 || ['A', 'I', 'a'].includes(word)
  );

  return words.join(' ');
}


async function parseUploadedFile(files: multer.File[]): Promise<string> {
  if (!files || files.length === 0) {
    throw new Error('No files provided');
  }
  const file = files[0];
  const mimeType = file.mimetype;
  const buffer = file.buffer;

  try {
    switch (mimeType) {
      case 'application/pdf': {
        const data = await pdfParse(buffer);
        return data.text;
      }
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      }
      case 'image/png':
      case 'image/jpeg': {
        const worker = await createWorker();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const { data: { text } } = await worker.recognize(buffer);
        await worker.terminate();
        // @ts-ignore
        const parsedText = await this.cleanOCRText(text);
        return parsedText;
      }
      default:
        throw new Error(`Unsupported mime type: ${mimeType}`);
    }
  } catch (error: any) {
    console.error('Document parsing error:', error);
    throw new Error(`Failed to parse document: ${error.message}`);
  }
}