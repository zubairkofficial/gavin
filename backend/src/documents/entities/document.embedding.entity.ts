import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export interface DocumentEmbeddingMetadata {
  document_id: string;
  processed_at: string;
  [key: string]: any;
}

@Entity('document_embeddings')
export class DocumentEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ type: 'float', array: true })
  embedding: number[];

  @Column('jsonb')
  metadata: DocumentEmbeddingMetadata;
}