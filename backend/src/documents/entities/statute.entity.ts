import BaseEntity from '@/common/entities/BaseEntity';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Statute extends BaseEntity{

    @Column({nullable: true})
    fileName: string;

    @Column({nullable:true})
    title: string;

    @Column({nullable: true})
    jurisdiction: string;

    @Column({nullable: true})
    code: string;

    @Column({nullable: true})
    type: string;

    @Column({nullable: true})
    court: string;

    @Column({nullable: true})
    filePath: string;

    @Column({ type: 'date'  , nullable: true})
    decision_date: string;

    @Column({nullable: true})
    citation: string;

    @Column({ type: 'text'  , nullable: true })
    holding_summary: string;

    @Column({nullable: true})
    userId: string;
    
    @Column({ type: 'text' , nullable:true })
    content_html: string;

    @Column({ type: 'text'  , nullable: true })
    section: string;

    @Column("text", { array: true  , nullable: true })
    tags: string[];

    @Column({nullable: true})
    source_url: string;

    @Column({nullable: true , default :true})
    isEnabled: boolean;

}
