import BaseEntity from '@/common/entities/BaseEntity';
import { Column, Entity } from 'typeorm';

@Entity()
export class AuthToken extends BaseEntity {
  @Column()
  type: string;

  @Column()
  token: string;

  @Column()
  identifier: string;

  @Column()
  TTL: Date;
}
