import BaseEntity from '@/common/entities/BaseEntity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Contract } from './contract.entity';

@Entity()
export class Clause extends BaseEntity {
  @Column()
  contract_id: number;

  @Column()
  clause_type: string;

  @Column()
  risk_level: string;

  @Column()
  jurisdiction: string;

  @Column()
  language_variant: string;

 @Column({ type: 'text', nullable: true }) 
  clause_text: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;
}
