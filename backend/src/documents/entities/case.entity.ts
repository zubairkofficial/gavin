import BaseEntity from '@/common/entities/BaseEntity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Contract } from './contract.entity';

@Entity()
export class Case extends BaseEntity {

  @Column({nullable : true})
  name: string;

  @Column({nullable : true})
  jurisdiction: string;

  @Column({nullable :true})
  court: string;

  @Column({nullable :true})
  fileName: string;

  @Column({nullable : true})
  decision_date: string;

  @Column({nullable : true})
  citation: string;


  @Column({nullable : true})
  holding_summary: string;

 @Column({ type: 'text', nullable: true }) 
  content_html: string;

  @Column({ nullable: true })
  source_url: string;

  @Column({  nullable: true })
  filePath: string;

  @Column({  nullable: true })
  case_type: string;

  @Column({  nullable: true })
  type: string;

  @Column({  nullable: true , default : true })
  isEnabled: boolean;

}
