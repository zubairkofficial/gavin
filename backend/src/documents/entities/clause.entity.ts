import BaseEntity from '@/common/entities/BaseEntity';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Clause extends BaseEntity{

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
    notes: string;
}
