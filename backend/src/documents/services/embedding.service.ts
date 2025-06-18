import { Injectable, OnModuleInit } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private embeddings: OpenAIEmbeddings;
  private vectorStore: PGVectorStore | null = null;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor(
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
    content: string;
    additionalMetadata?: Record<string, any>;
  }): Promise<{ processedChunks: number; documentId: string }> {
    const { 
      documentId, 
      content,
      additionalMetadata = {} 
    } = params;

    try {
      // Ensure vector store is initialized
      const vectorStore = await this.ensureVectorStore();

      // Delete any existing embeddings for this document from vector store
      await vectorStore.delete({ 
        filter: { document_id: documentId } 
      });

      // Split text into chunks
      const texts = await this.textSplitter.splitText(content);

      // Create LangChain documents with comprehensive metadata
      const documents = texts.map((text, index) => {
        return new Document({
          pageContent: text,          metadata: {
            document_id: documentId,
            processed_at: new Date().toISOString(),
            content_length: text.length,
            ...additionalMetadata
          }
        });
      });

      // Add all documents to vector store in batches
      const batchSize = 50;
      let processedCount = 0;

      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        
        await vectorStore.addDocuments(batch);
        
        processedCount += batch.length;
        console.log(`Processed ${processedCount}/${documents.length} chunks for document ${documentId}`);
      }

      console.log(`Successfully processed document ${documentId} with ${documents.length} chunks`);
          
      return {
        processedChunks: documents.length,
        documentId
      };

    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error);
      throw new Error(`Failed to process document ${documentId}: ${error.message}`);
    }
  }

  /**
   * Search for similar documents
   */
  async search(
    query: string, 
    options: {
      limit?: number;
      filter?: Record<string, any>;
      threshold?: number;
    } = {}
  ): Promise<Array<{
    content: string;
    metadata: Record<string, any>;
    score?: number;
  }>> {
    const { limit = 5, filter, threshold } = options;
    
    try {
    const vectorStore = await this.ensureVectorStore();
      
      // Use similarity search with score if threshold is provided
      const results = threshold 
        ? await vectorStore.similaritySearchWithScore(query, limit, filter)
        : await vectorStore.similaritySearch(query, limit, filter);

      // Filter by threshold if provided and format results
      const formattedResults = results
        .filter(result => {
          if (threshold && Array.isArray(result) && result.length > 1) {
            return result[1] >= threshold; // result[1] is the score
          }
          return true;
        })
        .map(result => {
          const [doc, score] = Array.isArray(result) ? result : [result, undefined];
          return {
            content: doc.pageContent,
            metadata: doc.metadata || {},
            ...(score !== undefined && { score })
          };
        });

      return formattedResults;

    } catch (error) {
      console.error('Error searching documents:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Delete all embeddings for a specific document
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      const vectorStore = await this.ensureVectorStore();
      await vectorStore.delete({ 
        filter: { document_id: documentId } 
      });
      
      console.log(`Successfully deleted embeddings for document ${documentId}`);
    } catch (error) {
      console.error(`Error deleting document ${documentId}:`, error);
      throw new Error(`Failed to delete document ${documentId}: ${error.message}`);
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStats(documentId?: string): Promise<{
    totalDocuments: number;
    totalChunks: number;
    documentId?: string;
  }> {
    try {
      const vectorStore = await this.ensureVectorStore();
      
      // This is a simplified implementation - actual implementation depends on PGVectorStore capabilities
      // You might need to implement this using direct SQL queries if PGVectorStore doesn't support counting
      
      if (documentId) {
        const results = await vectorStore.similaritySearch('', 1000, { document_id: documentId });
        return {
          totalDocuments: 1,
          totalChunks: results.length,
          documentId
        };
      }
      
      // For overall stats, you might need to query the database directly
      return {
        totalDocuments: 0, // Implement based on your needs
        totalChunks: 0
      };
      
    } catch (error) {
      console.error('Error getting document stats:', error);
      throw new Error(`Failed to get document stats: ${error.message}`);
  }
}
}