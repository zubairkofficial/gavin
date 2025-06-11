// src/govinfo/govinfo.entity.ts
import BaseEntity from '@/common/entities/BaseEntity';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('govinfo_documents')
export class GovInfoDocument extends BaseEntity {

  @Column({ nullable: true })
  package_id: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  date: string;

  @Column({ nullable: true })
  collection: string;

  @Column({ type: 'jsonb' })
  data: any;

   @Column('text', { array: true, nullable: true, default: '{}' })
  url: string[]; // Assuming url is an array of strings, adjust as necessary
}
