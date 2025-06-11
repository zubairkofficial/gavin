import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Clause {
    @PrimaryGeneratedColumn()
    id: number;

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
