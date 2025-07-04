import BaseEntity from '@/common/entities/BaseEntity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('messages')
@Index(['userId', 'createdAt'])
@Index(['createdAt'])
export class Message extends BaseEntity {

  @Column('text')
  userMessage: string;

  @Column('text')
  aiResponse: string;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  conversationId?: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  fileName?: string;

  @Column({ nullable: true })
  fileSize?: string;

  @Column({ nullable: true })
  fileType?: string;
}