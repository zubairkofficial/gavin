import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Regulation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    jurisdiction: string;

    @Column()
    citation: string;

    @Column()
    title: string;

    @Column()
    section: string;

    @Column()
    subject_area: string;

    @Column({ type: 'text' })
    summary: string;

    @Column({ type: 'text' })
    full_text: string;

    @Column()
    source_url: string;

    @Column({ type: 'date' })
    updated_at: string;
}
