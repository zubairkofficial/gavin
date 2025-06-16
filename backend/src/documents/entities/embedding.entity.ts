import BaseEntity from '@/common/entities/BaseEntity';
import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface DocumentEmbeddingMetadata {
  document_id: string;
  user_id: string;
  chunk_id: number;
  [key: string]: any;
}

@Entity('document_embeddings')
export class DocumentEmbedding extends BaseEntity {

  @Column('text')
  content: string;

  @Column('float', { array: true })
  embedding: number[];

  @Column('jsonb')
  metadata: DocumentEmbeddingMetadata;

}
