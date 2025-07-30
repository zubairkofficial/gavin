import BaseEntity from '@/common/entities/BaseEntity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('subscriptions')
export class Subscription extends BaseEntity {

  @Column()
  userId: string;

  @Column({ default: 'Gavin Subscription' })
  name: string;

  @Column()
  credits: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'active', 'cancelled'],
    default: 'pending'
  })
  status: 'pending' | 'active' | 'cancelled';

  @Column({ unique: true })
  stripeSessionId: string;

}