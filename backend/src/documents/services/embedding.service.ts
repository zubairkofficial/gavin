import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEmbedding } from '../entities/document.embedding.entity';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private embeddings: OpenAIEmbeddings;
  private vectorStore: PGVectorStore | null = null;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor(
    @InjectRepository(DocumentEmbedding)
    private embeddingRepository: Repository<DocumentEmbedding>
  ) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined');
    }

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName: "text-embedding-ada-002",
      batchSize: 512,
      stripNewLines: true,
    });

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
  }

  async onModuleInit() {
    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT;
    const dbUser = process.env.DB_USERNAME;
    const dbPass = process.env.DB_PASSWORD;
    const dbName = process.env.DB_DATABASE;

    if (!dbHost || !dbPort || !dbUser || !dbPass || !dbName) {
      throw new Error('Database configuration is incomplete');
    }

    await this.ensureVectorStore();
  }

  private async ensureVectorStore() {
    if (!this.vectorStore) {
      const dbHost = process.env.DB_HOST;
      const dbPort = process.env.DB_PORT;
      const dbUser = process.env.DB_USERNAME;
      const dbPass = process.env.DB_PASSWORD;
      const dbName = process.env.DB_DATABASE;

      if (!dbHost || !dbPort || !dbUser || !dbPass || !dbName) {
        throw new Error('Database configuration is incomplete');
      }

      this.vectorStore = await PGVectorStore.initialize(this.embeddings, {
        postgresConnectionOptions: {
          host: dbHost,
          port: parseInt(dbPort),
          user: dbUser,
          password: dbPass,
          database: dbName,
        },
        tableName: 'document_embeddings',
        columns: {
          idColumnName: 'id',
          vectorColumnName: 'embedding',
          contentColumnName: 'content',
          metadataColumnName: 'metadata',
        },
      });
    }
    return this.vectorStore;
  }

  /**
   * Process document text and create embeddings with metadata
   */
  async processDocument(params: {
    documentId: string;
    userId: string;
    content: string;
    documentType?: string;
    jurisdiction?: string;
    additionalMetadata?: Record<string, any>;
  }): Promise<DocumentEmbedding[]> {
    const { 
      documentId, 
      userId, 
      content, 
      documentType = 'unknown',
      jurisdiction = 'unknown',
      additionalMetadata = {} 
    } = params;

    // Delete any existing embeddings for this document
    await this.embeddingRepository
      .createQueryBuilder()
      .delete()
      .where(`metadata->>'document_id' = :documentId`, { documentId })
      .execute();

    try {
      // Split text into chunks
      const texts = await this.textSplitter.splitText(content);

      // Create LangChain documents with metadata
      const documents = texts.map((text, index) => {
        return new Document({
          pageContent: text,          metadata: {
            document_id: documentId,
            processed_at: new Date().toISOString()
          }
        });
      });

      // Ensure vector store is initialized
      const vectorStore = await this.ensureVectorStore();

      // Process documents in batches to avoid memory issues
      const batchSize = 10;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        const embeddings = await this.embeddings.embedDocuments(
          batch.map(doc => doc.pageContent)
        );

        // Add vectors to store with proper formatting        await vectorStore.addVectors(
          embeddings.map(emb => emb.map(val => parseFloat(val.toString()))),
          batch
      
      }

      // Save to our repository
      const savedEmbeddings = await Promise.all(
        documents.map(async (doc, index) => {
          const embedding = new DocumentEmbedding();
          embedding.content = doc.pageContent;
          embedding.metadata = doc.metadata;
          
          // Get embedding vector from OpenAI and ensure proper number formatting
          const [embeddingVector] = await this.embeddings.embedDocuments([doc.pageContent]);
          embedding.embedding = embeddingVector.map(val => parseFloat(val.toString()));
          
          return this.embeddingRepository.save(embedding);
        })
      );

      return savedEmbeddings;

    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }

  /**
   * Search for similar documents
   */
  async search(query: string, limit: number = 5): Promise<DocumentEmbedding[]> {
    const vectorStore = await this.ensureVectorStore();
    const results = await vectorStore.similaritySearch(query, limit);
    
    return results.map(result => {
      const embedding = new DocumentEmbedding();
      embedding.content = result.pageContent;      embedding.metadata = {
        document_id: result.metadata?.document_id || '',
        processed_at: result.metadata?.processed_at || new Date().toISOString()
      };
      return embedding;
    });
  }
}
