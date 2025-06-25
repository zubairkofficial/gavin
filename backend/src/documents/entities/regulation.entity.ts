import BaseEntity from '@/common/entities/BaseEntity';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Regulation extends BaseEntity{
    

    @Column({nullable: true})
    jurisdiction: string;

    @Column({nullable: true})
    type: string;

    @Column({nullable: true})
    userId: string;

    @Column({nullable: true})
    citation: string;

    @Column({nullable: true})
    filePath: string;

    @Column({nullable: true})
    fileName: string;

    @Column()
    title: string;

    @Column({nullable: true})
    section: string;

    @Column({nullable: true})
    subject_area: string;

    @Column({ type: 'text'  , nullable: true})
    summary: string;

    @Column({ type: 'text' })
    content_html: string;

    @Column({nullable: true})
    source_url: string;

    @Column({ type: 'date' , nullable: true})
    updated_at: string;
}
