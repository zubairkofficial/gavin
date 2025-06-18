import BaseEntity from '@/common/entities/BaseEntity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Clause } from './clause.entity';
import { IS_OPTIONAL, IsOptional } from 'class-validator';

@Entity()
export class Contract extends BaseEntity {
  

  @Column()
  type: string;

  @Column()
  title: string;

  @IsOptional()
  @Column()
  fileName : string;

  @Column()
  jurisdiction: string;


  @Column({ type: 'text' })
  content_html: string;

  @OneToMany(() => Clause, (clause) => clause.contract)
  clauses: Clause[];

  @Column()
  source: string;


}
