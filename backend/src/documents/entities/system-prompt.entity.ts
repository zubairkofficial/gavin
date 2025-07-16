import BaseEntity from '@/common/entities/BaseEntity';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SystemPrompt extends BaseEntity {



  @Column('text')
  prompt: string;

}
