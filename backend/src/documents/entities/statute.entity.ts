import BaseEntity from '@/common/entities/BaseEntity';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Statute extends BaseEntity{

    @Column()
    fileName: string;

    @Column()
    title: string;

    @Column()
    jurisdiction: string;

    @Column()
    type: string;

    @Column()
    court: string;

    @Column({ type: 'date' })
    decision_date: string;

    @Column()
    citation: string;

    @Column({ type: 'text' })
    holding_summary: string;

    @Column({nullable: true})
    userId: string;
    
    @Column({ type: 'text' })
    full_text: string;

    @Column("text", { array: true })
    tags: string[];

    @Column()
    source_url: string;

    @Column({ nullable: true })
    filename: string;
}
