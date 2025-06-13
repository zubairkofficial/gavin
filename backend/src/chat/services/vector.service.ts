import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DocumentEntity } from '../entities/document.entity';

@Injectable()
export class VectorService {
  private genAI: GoogleGenerativeAI;
  private embeddingModel: string = 'embedding-001';

  constructor(
    @InjectRepository(DocumentEntity)
    private documentRepository: Repository<DocumentEntity>
  ) {
    // Initialize Gemini with your API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async createAndStoreEmbeddings(text: string, metadata: Record<string, any>) {
    // Generate embeddings using Gemini
    const model = this.genAI.getGenerativeModel({ model: this.embeddingModel });
    const result = await model.embedContent(text);
    const embeddingVector = result.embedding.values;

    // Create new document
    const document = this.documentRepository.create({
      content: text,
      embedding: embeddingVector,
      metadata: metadata,
    });

    // Save to database
    return await this.documentRepository.save(document);
  }

  async findSimilarDocuments(text: string, limit: number = 5) {
    // Generate embedding for the query text
    const model = this.genAI.getGenerativeModel({ model: this.embeddingModel });
    const result = await model.embedContent(text);
    const queryEmbedding = result.embedding.values;
    
    // Perform similarity search using cosine distance
    return await this.documentRepository
      .createQueryBuilder('doc')
      .select()
      .orderBy(
        `doc.embedding <=> '[${queryEmbedding.join(',')}]'::vector`,
        'ASC'
      )
      .limit(limit)
      .getMany();
  }
}

// Example usage (should be done inside a NestJS provider, not directly here)
// The following code is for illustration only and should be used in a proper NestJS context,
// such as inside a controller or another service where dependency injection is available.

// Example:
// @Controller()
// export class SomeController {
//   constructor(private readonly vectorService: VectorService) {}

//   async someMethod() {
//     await this.vectorService.createAndStoreEmbeddings(
//       "This is a message about AI technology",
//       { category: "technology" }
//     );

//     const similarDocs = await this.vectorService.findSimilarDocuments(
//       "Tell me about AI"
//     );
//     // Returns up to 5 most similar documents
//   }
// }