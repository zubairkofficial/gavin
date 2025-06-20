import BaseEntity from '@/common/entities/BaseEntity';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Regulation extends BaseEntity{
    

    @Column()
    jurisdiction: string;

    @Column()
    type: string;

    @Column({nullable: true})
    userId: string;

    @Column()
    citation: string;

    @Column({nullable: true})
    filePath: string;

    @Column({nullable: true})
    fileName: string;

    @Column()
    title: string;

    @Column()
    section: string;

    @Column()
    subject_area: string;

    @Column({ type: 'text' })
    summary: string;

    @Column({ type: 'text' })
    content_html: string;

    @Column()
    source_url: string;

    @Column({ type: 'date' })
    updated_at: string;
}
