import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { CreateMessageDto } from './dto/create-message.dto';
import { v4 as uuidv4 } from 'uuid';
import { DistanceStrategy, PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Message } from './entities/message.entity';
import { Repository, IsNull, Not } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BufferMemory } from 'langchain/memory';
import { Contract } from '@/documents/entities/contract.entity';
import { Regulation } from '@/documents/entities/regulation.entity';
import { Case } from '@/documents/entities/case.entity';
import { Statute } from '@/documents/entities/statute.entity';
import * as multer from 'multer';
import { z } from 'zod';
import { createWorker } from 'tesseract.js';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { Configuration } from '@/documents/entities/configuration.entity';
import { User } from '@/auth/entities/user.entity';
import { tool } from '@langchain/core/tools';
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import {PromptManagerService} from './prompt-manager.service';



@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private model: ChatOpenAI;
  private searchModel: ChatOpenAI;
  private vectorStore: PGVectorStore;
  @InjectRepository(User)
  private usersRepository: Repository<User>;
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

  @InjectRepository(Configuration)
  private configurationRepository: Repository<Configuration>;

  constructor(private configService: ConfigService , private promptManagerService: PromptManagerService) {
    const openAiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!openAiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.model = new ChatOpenAI({
      openAIApiKey: openAiApiKey,
      modelName: 'gpt-4o-mini',
      streaming: true,
    });
    this.searchModel = new ChatOpenAI({
      openAIApiKey: openAiApiKey,
      modelName: 'gpt-4o-mini-search-preview',
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
`},

      },
      tableName: "document_embeddings",
      columns: {
        idColumnName: "id",
        vectorColumnName: "embedding",
        contentColumnName: "content",
        metadataColumnName: "metadata",
      },
      distanceStrategy: "euclidean" as DistanceStrategy,
    };

    this.vectorStore = new PGVectorStore(
      new OpenAIEmbeddings({ model: "text-embedding-ada-002", openAIApiKey: openAiApiKey }),
      PG_CONFIG
    );
  }

  async sendMessage(createMessageDto: CreateMessageDto, req: any, files: multer.File[]): Promise<{

    stream: any,
    conversationId: string,
    userId?: string,
    annotations?: any[],
    fileContent?: string,
    documentContext?: any[],
    title?: string
    filename: string,
    size: string,
    type: string,
  }> {
    const { message, conversationId, title, websearch } = createMessageDto;
    if (!message) throw new BadRequestException('Message cannot be empty');

    console.log('websearch:', websearch);

    // console.log(files, 'files in chat service')
    const file = files[0];
    const fileName = file?.originalname;
    const fileSize = file?.size;
    const fileType = file?.mimetype;
    let fileContent = '';
    if (files && files.length > 0) {
      fileContent = await parseUploadedFile(files);
    }

    const convId = conversationId || uuidv4();
    const userId = req.user?.id;

    // const data = await this.usersRepository.findOne({
    //   where: {
    //     id: userId
    //   }
    // })



    // const config = await this.configurationRepository.find()
    // let minTokens
    // if (config) {
    //   minTokens = config[0]?.minTokens
    // }

    // if ((data?.credits ?? 0) < minTokens) {
    //   throw new BadRequestException('You have low credits, please Add credits');
    // }

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
      // Build chat history string
      let chatHistoryContext = '';
      if (previousMessages.length > 0) {
        chatHistoryContext = previousMessages
          .map(msg => `User: ${msg.userMessage}\nAI: ${msg.aiResponse}  \n ${msg.fileContent}`)
          .join('\n');
      }

      const memory = new BufferMemory({
        memoryKey: 'chat_history',
        inputKey: 'input',
        outputKey: 'output',
      });
      let documentContext: Array<{ title: string; reference: string; jurisdiction?: string; citation?: string; subject_area?: string; code?: string; decision_date?: string; name?: string; case_type?: string; }> = [];
      let annotations: Array<{ title: string; reference: string, type: string, start_index: string, end_index: string, }> = [];
      let str
      let ftitle


      if (websearch == 'true') {
        console.log('Web search enabled for this message');
        let context = '';

        context += fileContent ? `File Content:\n${fileContent}\n` : '';
        
        const promptfromDB = await this.promptManagerService.getSystemPrompt();
        console.log('Prompt from DB:', promptfromDB);
        const systemPrompt = `${promptfromDB}`
        let prompt = `
        Use the following information to answer the question:
        ${fileContent ? `File Content:\n${fileContent}\n` : ''}
        ${context ? `Context:\n${context}\n` : ''}
        ${chatHistoryContext ? `Chat History:\n${chatHistoryContext}\n` : ''}

        if ${fileContent} just use the file content and chat history context to answer the question.

        Question:
        ${message}
        `;

        const llm = new ChatOpenAI({ model: "gpt-4o-mini", streaming: true }).bindTools([
          { type: "web_search_preview" },
        ]);

        const stream = await llm.invoke([
          new SystemMessage(systemPrompt),
          new HumanMessage(prompt)
        ]);

        if (stream?.response_metadata?.output) {
          stream.response_metadata.output.forEach((output: any, index: number) => {
            // console.log(`Processing Output[${index}]`);
            if (output?.content && Array.isArray(output.content)) {
              output.content.forEach((content: any, contentIndex: number) => {
                // console.log(`Processing Content[${contentIndex}]`);
                if (content?.annotations && Array.isArray(content.annotations)) {
                  content.annotations.forEach((annotation: any, annotationIndex: number) => {
                    // console.log(`Annotation----------------[${annotationIndex}]:`, annotation);
                    annotations.push({
                      title: annotation.title || '',
                      reference: annotation.url || '',
                      type: annotation.type || '',
                      start_index: annotation.startIndex || 0,
                      end_index: annotation.endIndex || 0,
                    })

                  });
                }
              });
            }
          });
        }


        str = stream
        const finalTitle = conTitle || title;
        ftitle = finalTitle
        if (fileContent) {
          documentContext = []
        }

      } else if (websearch == 'false') {
        const jurisdictionFromUser = createMessageDto.jurisdiction
        const ragTool = tool(
          async ({ message, jurisdiction , jurisdictionFromUser }) => {
            try {
              console.log('RAG search for:', message, 'in jurisdiction:', createMessageDto.jurisdiction);

              let relevantDocs: any[] = [];

              const enabledDocsWithScores = await this.vectorStore.similaritySearchWithScore(message, 7, {
                filter: { enabled: true, jurisdiction:  jurisdictionFromUser || jurisdiction },
              });

              console.log('Found documents:', enabledDocsWithScores.length);

              const sortedDocs = enabledDocsWithScores.sort((a, b) => a[1] - b[1]);
              const top3DocsWithScores = sortedDocs.slice(0, 3);
              relevantDocs = top3DocsWithScores.map(([doc]) => doc);

              let context = '';

              if (relevantDocs.length > 0) {
                console.log('jurisdictionfromuser:', createMessageDto.jurisdiction);
                const enabledDocs = relevantDocs.filter(doc =>
                  doc.metadata &&
                  doc.metadata.enabled === true &&
                 (!createMessageDto.jurisdiction || (createMessageDto.jurisdiction && doc.metadata.jurisdiction === createMessageDto.jurisdiction))
                );
                console.log('Enabled documents:', enabledDocs.length);

                if (enabledDocs.length > 0) {
                  const seenIds = new Set();

                  for (const doc of enabledDocs) {
                    if (seenIds.has(doc.metadata.document_id)) continue;
                    seenIds.add(doc.metadata.document_id);

                    try {
                      if (doc.metadata.document_type === 'contract') {
                        const document = await this.contractRepository
                          .createQueryBuilder('c')
                          .select(['c.jurisdiction', 'c.title', 'c.fileName', 'c.filePath', 'c.isEnabled'])
                          .where('c.id = :id', { id: doc.metadata.document_id })
                          .getOne();

                        if (document) {
                          let finalPath = document.filePath?.startsWith('http')
                            ? `<${document.filePath}>`
                            : `${process.env.BASE_URL}/static/files/${document.filePath}`;

                          documentContext.push({
                            title: document.title || '',
                            reference: finalPath,
                            jurisdiction: document.jurisdiction || '',
                          });
                        }
                      } else if (doc.metadata.document_type === 'regulation') {
                        const document = await this.regulationRepository
                          .createQueryBuilder('c')
                          .select(['c.jurisdiction', 'c.title', 'c.citation', 'c.filePath', 'c.subject_area'])
                          .where('c.id = :id', { id: doc.metadata.document_id })
                          .getOne();

                        if (document) {
                          let finalPath = document.filePath?.startsWith('http')
                            ? document.filePath
                            : `${process.env.BASE_URL}/static/files/${document.filePath}`;

                          documentContext.push({
                            title: document.title || '',
                            reference: finalPath,
                            citation: document.citation || '',
                            subject_area: document.subject_area || '',
                          });
                        }
                      } else if (doc.metadata.document_type === 'case') {
                        const document = await this.caseRepository
                          .createQueryBuilder('c')
                          .select(['c.court', 'c.citation', 'c.name', 'c.filePath', 'c.case_type', 'c.decision_date'])
                          .where('c.id = :id', { id: doc.metadata.document_id })
                          .getOne();

                        if (document) {
                          let finalPath = document.filePath?.startsWith('http')
                            ? `<${document.filePath} target="_blank">`
                            : `${process.env.BASE_URL}/static/files/${document.filePath}`;

                          documentContext.push({
                            title: document.court || '',
                            reference: finalPath,
                            citation: document.citation || '',
                            name: document.name || '',
                            case_type: document.case_type || '',
                            decision_date: document.decision_date || '',
                          });
                        }
                      } else if (doc.metadata.document_type === 'statute') {
                        const document = await this.statuteRepository
                          .createQueryBuilder('c')
                          .select(['c.title', 'c.filePath', 'c.code', 'c.section'])
                          .where('c.id = :id', { id: doc.metadata.document_id })
                          .getRawOne();

                        if (document) {
                          let finalPath = document.c_filePath?.startsWith('http')
                            ? `<${document.c_filePath}>`
                            : `${process.env.BASE_URL}/static/files/${document.c_filePath}`;

                          documentContext.push({
                            title: document.c_title || '',
                            reference: finalPath,
                            code: document.c_code || '',
                          });
                        }
                      }
                    } catch (docError) {
                      console.error(`Error fetching document ${doc.metadata.document_id}:`, docError);
                    }
                  }


                  context = enabledDocs.map(doc => doc.pageContent).join('\n');
                }
              }

              return {
                context,
                documentContext,
                documentsFound: relevantDocs.length
              };
            } catch (error) {
              console.error('RAG Tool Error:', error);
              return {
                context: '',
                documentContext: [],
                documentsFound: 0,
                error: error.message
              };
            }
          },
          {
            name: "rag_search",
            description: "Searches legal documents using RAG for the given message and jurisdiction. .",
            schema: z.object({
              message: z.string().min(1, "Message is required"),
              jurisdiction: z.string().describe("Legal jurisdiction (e.g., 'FEDERAL', 'TX', 'NY', etc.)"),
              jurisdictionFromUser: z.string().optional().describe("Legal jurisdiction (e.g., 'FEDERAL', 'TX', 'NY', etc.)"),
            }),
          }
        );


        let promptfromDB = '';

        const data = await this.configurationRepository.find({
        })
        // console.log('data that we got for the system prompt',data[0]?.prompt )
        promptfromDB = data[0]?.prompt 
        if (data.length == 0) {
          const data = await this.configurationRepository.create({
            prompt: `🧑‍🚀 Your name is Gavin AI. You are a legal AI assistant.
        Instructions:
          - *Context Understanding*: Check follow-up questions by analyzing the chat history and current question context.
          - *For New Questions*: Use Document Context and File Content first, then chat history for additional context.
          - If you do not find an answer in the Document Context, File Content, or chat history, respond with what you can based on the provided information also web search as well.
          - Provide the answer in a concise manner.
          - `
          })
          const dat = await this.configurationRepository.save(data)
        // console.log('System prompt created after save:', dat.prompt);
          promptfromDB = dat.prompt
        }
        const systemPrompt = `${promptfromDB}`


        const createReActAgent = () => {
          const tools = [ragTool];

          return createReactAgent({
            llm: this.model,
            tools,
            prompt: ` ${systemPrompt}
                    if file content is provided, use it to answer the question and dont use rag_search.
                    Instructions:
                    - If only message is provided, ask the user for jurisdiction first
                    ${chatHistoryContext ? `- Use chat history for additional context: ${chatHistoryContext}` : ''}
                    ${fileContent ? `- Use file content for additional context: ${fileContent}` : ''}

                    `,
          });
        };

        let inputs = { messages: [{ role: "user", content:  `${message}  ${!createMessageDto.jurisdiction ? `in jurisdiction ${createMessageDto.jurisdiction}` : '' }` }] };

        const result = await createReActAgent().invoke(inputs, {
          streamMode: "values",
        });

        str = await result;
        let combinedResponse = '';

        // Handle message chunks from the result
        for (const message of str.messages) {
          if (message.content) {
            combinedResponse += message.content;
          }

          // Handle tool calls if present
          if (message.additional_kwargs?.tool_calls) {
            for (const toolCall of message.additional_kwargs.tool_calls) {
            }
          }
        }

        const finalTitle = conTitle || title;
        ftitle = finalTitle;
        if (fileContent) {
          documentContext = [];
        }
        
      }
      return {
        stream: str, // or stream, if you want to keep streaming
        documentContext,
        conversationId: convId,
        userId,
        annotations,
        fileContent,
        title: ftitle,
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
    type: string,
    fileContent?: string

  ): Promise<Message> {
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
      messageEntity.fileContent = fileContent || '';

      const msg = await this.messageRepository.save(messageEntity);
      // console.log('Message saved successfully');

      return msg;
    } catch (saveError) {
      console.error('Error saving message:', saveError);
      throw saveError;
    }
  }

  async updateMessage(
    messageId: string,
    updateData: {
      humanMessage: string,
      aiMessage: string,
      title: string,
      userId: string | undefined,
      conversationId: string,
      filename: string,
      size: string,
      type: string,
      fileContent?: string
    }
  ): Promise<Message> {
    try {
      // Find existing message
      const existingMessage = await this.messageRepository.findOne({
        where: { id: messageId }
      });

      if (!existingMessage) {
        throw new Error(`Message with ID ${messageId} not found`);
      }

      // Update message fields
      existingMessage.userMessage = updateData.humanMessage;
      existingMessage.aiResponse = updateData.aiMessage;
      existingMessage.title = updateData.title;
      existingMessage.userId = updateData.userId ? String(updateData.userId) : undefined;
      existingMessage.conversationId = updateData.conversationId;
      existingMessage.fileName = updateData.filename;
      existingMessage.fileSize = updateData.size;
      existingMessage.fileType = updateData.type;
      existingMessage.fileContent = updateData.fileContent || '';

      // Save updated message
      const updatedMessage = await this.messageRepository.save(existingMessage);
      console.log('Message updated successfully');

      return updatedMessage;

    } catch (updateError) {
      console.error('Error updating message:', updateError);
      throw updateError;
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
        content: `You are a creative storyteller`
      },
      {
        role: 'user',
        content: `Create a short title of maximum 4 words based on this message: ${message}`
      }
    ])

    const aiResponse = completion.content;
    // console.log(aiResponse)

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
        content: `Generate a list of 3 diverse, creative template suggestions for an AI-powered personal assistant chatbot. The suggestions should align with the features and categories the bot can handle, based on the user's natural language input`
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

  async getUniqueConversationsByUser(
    userId: string
  ): Promise<{ conversationId: string; title: string; createdAt: Date }[]> {
    return this.messageRepository
      .createQueryBuilder('m')
      .select([
        'DISTINCT ON (m.conversationId) m.conversationId AS conversationId',
        'm.title AS title',
        'm.createdAt AS createdAt'
      ])
      .where('m.userId = :userId', { userId })
      .andWhere('m.deletedAt IS NULL')
      .orderBy('m.conversationId, m.createdAt', 'ASC')
      .getRawMany();
  }


  async restoreConversation(conversationId: string, userId: string): Promise<void> {
    try {
      // Set deletedAt to null to restore the conversation
      await this.messageRepository.update(
        { conversationId, userId },
        { deletedAt: () => 'NULL' }
      );
    } catch (error) {
      console.error('Error restoring conversation:', error);
      throw new Error('Failed to restore conversation');
    }
  }

  async permnatDelConversation(conversationId: string, userId: string): Promise<void> {
    try {
      // Set deletedAt to null to restore the conversation
      await this.messageRepository.delete({
        conversationId,
        userId
      });
    } catch (error) {
      console.error('Error restoring conversation:', error);
      throw new Error('Failed to restore conversation');
    }
  }


  async getDeletedConversationsByUser(
    userId: string
  ): Promise<{ conversationId: string; title: string; createdAt: Date; deletedAt: Date }[]> {
    console.log('Fetching deleted conversations for user:', userId);

    try {
      // Approach 1: Using subquery to get the first message per conversation
      const deletedConversations = await this.messageRepository
        .createQueryBuilder('m')
        .select([
          'm.conversationId',
          'm.title',
          'm.createdAt',
          'm.deletedAt'
        ])
        .where('m.userId = :userId', { userId })
        .andWhere('m.deletedAt IS NOT NULL')
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select('MIN(m2.createdAt)')
            .from('message', 'm2') // Replace 'message' with your actual table name
            .where('m2.conversationId = m.conversationId')
            .andWhere('m2.userId = :userId')
            .getQuery();
          return `m.createdAt = (${subQuery})`;
        })
        .withDeleted() // Important for soft deletes
        .orderBy('m.deletedAt', 'DESC')
        .getMany();

      console.log('Found deleted conversations (first messages):', deletedConversations);

      return deletedConversations.map(msg => ({
        conversationId: msg.conversationId ?? '',
        title: msg.title ?? '',
        createdAt: msg.createdAt,
        deletedAt: msg.deletedAt
      }));

    } catch (error) {
      console.error('Error fetching deleted conversations:', error);

      // Fallback approach: Get all deleted messages and filter in JavaScript
      try {
        console.log('Trying fallback approach...');

        const allDeletedMessages = await this.messageRepository.find({
          select: ['conversationId', 'title', 'createdAt', 'deletedAt'],
          where: {
            userId,
            deletedAt: Not(IsNull())
          },
          withDeleted: true,
          order: {
            createdAt: 'ASC' // Order by creation time to get first messages
          }
        });

        // Group by conversationId and take the first message from each group
        const conversationMap = new Map<string, any>();

        for (const message of allDeletedMessages) {
          const convId = message.conversationId ?? '';
          if (!conversationMap.has(convId)) {
            conversationMap.set(convId, message);
          }
        }

        const uniqueConversations = Array.from(conversationMap.values())
          .sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

        console.log('Fallback result:', uniqueConversations);

        return uniqueConversations.map(msg => ({
          conversationId: msg.conversationId ?? '',
          title: msg.title ?? '',
          createdAt: msg.createdAt,
          deletedAt: msg.deletedAt
        }));

      } catch (fallbackError) {
        console.error('Fallback approach also failed:', fallbackError);
        throw new Error('Failed to fetch deleted conversations');
      }
    }
  }

  async updateConversationTitle(conversationId: string, title: string, userId: string): Promise<void> {
    try {
      // Update all messages in the conversation with the new title
      await this.messageRepository.update(
        { conversationId, userId },
        { title }
      );
    } catch (error) {
      console.error('Error updating conversation title:', error);
      throw new Error('Failed to update conversation title');
    }
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    try {
      // Soft delete all messages in the conversation
      const result = await this.messageRepository.update(
        { conversationId, userId },
        { deletedAt: new Date() }
      );

      console.log('Delete operation result:', {
        conversationId,
        userId,
        affected: result.affected
      });

      // Verify the deletion worked
      const deletedMessages = await this.messageRepository.find({
        where: {
          conversationId,
          userId,
          deletedAt: Not(IsNull())
        }
      });
      console.log('Deleted messages count:', deletedMessages.length);

    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw new Error('Failed to delete conversation');
    }
  }
  async addCredits(userId: string, credits: number) {
    // Get user from repository
    const user = await this.usersRepository.findOne({
      where: {
        id: userId
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update credits field
    const updatedCredits = (user.credits || 0) + credits;

    // Update user with new credits
    const updatedUser = await this.usersRepository.update(userId, {
      credits: updatedCredits
    });

    return {
      message: 'Credits added successfully',
      userId: userId,
      previousCredits: user.credits || 0,
      addedCredits: credits,
      totalCredits: updatedCredits,
      user: updatedUser
    };
  }


  async manageCredits(minmessage: number, cutcredits: number) {
    // Check if configuration data exists
    const existingConfig = await this.configurationRepository.find();

    if (existingConfig) {
      console.log(existingConfig)
    }

    if (existingConfig) {
      // Update existing configuration
      // const updatedConfig = await this.configurationRepository.update( {
      //   minTokens : minmessage,
      //   cutCredits : cutcredits 
      // });

      //   const data = new Configuration()
      //  data.minTokens = minmessage
      //    data.cutCredits = cutcredits

      const existingPrompt = existingConfig[0]; // Get the first prompt since we only need one
      existingPrompt.minTokens = minmessage;
      existingPrompt.cutCredits = cutcredits;
      const updatedConfig = await this.configurationRepository.save(existingPrompt);

      //  const updatedConfig =  await this.configurationRepository.update(
      //   data)




      return {
        message: 'Configuration updated successfully',
        configuration: updatedConfig,
        action: 'updated'
      };
    } else {
      // Create new configuration
      const newConfig = await this.configurationRepository.create({
        minTokens: minmessage,
        cutCredits: cutcredits
      });

      return {
        message: 'Configuration created successfully',
        configuration: newConfig,
        action: 'created'
      };
    }
  }


  async getCredits(): Promise<{ minMessages: number, cutCredits: number }> {
    // Get user from repository
    const data = await this.configurationRepository.find();

    if (!data || data.length === 0) {
      throw new Error('we dont have any configuration data');
    }

    return {
      minMessages: data[0].minTokens || 0, // Assuming minTokens is the field for credits
      cutCredits: data[0].cutCredits || 0 // Assuming cutCredits is the field for credits deduction
    };
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
