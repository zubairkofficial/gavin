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
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  userMessage: string;

  @Column('text')
  aiResponse: string;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  conversationId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}