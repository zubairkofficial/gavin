import { Injectable, OnModuleInit } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { DataSource } from 'typeorm';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private embeddings: OpenAIEmbeddings;
  private vectorStore: PGVectorStore | null = null;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor(
    private dataSource: DataSource
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

  async deleteDocumentEmbadings(source : string): Promise<void> {
    try {
      const vectorStore = await this.ensureVectorStore();
      await vectorStore.delete({ 
        filter: { source  } 
      });
      
      console.log(`Successfully deleted embeddings for document ${source}`);
    } catch (error) {
      console.error(`Error deleting document ${source}:`, error);
      throw new Error(`Failed to delete document ${source}: ${error.message}`);
    }
  }

  /**
   * Get document statistics
   */


async updateMetadata(documentId: string, newMetadata: Record<string, any>): Promise<void> {
  try {
    await this.dataSource
      .createQueryBuilder()
      .update('document_embeddings')
      .set({ metadata: () => `${JSON.stringify(newMetadata)}` })
      .where("metadata->>'document_id' = :documentId", { documentId })
      .execute();

    console.log(`Successfully updated metadata for document ${documentId}`);
  } catch (error) {
    console.error(`Error updating metadata for document ${documentId}:`, error);
    throw new Error(`Failed to update metadata for document ${documentId}: ${error.message}`);
  }
}

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