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

@Entity()
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column()
  jurisdiction: string;


  @Column({ type: 'text' })
  content_html: string;

  @OneToMany(() => Clause, (clause) => clause.contract)
  clauses: Clause[];

  @Column()
  source: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
