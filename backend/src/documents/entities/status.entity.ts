import BaseEntity from '@/common/entities/BaseEntity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Contract } from './contract.entity';

@Entity()
export class Status extends BaseEntity {
    
  @Column({default:'false'})
  isScraping: boolean;
}
