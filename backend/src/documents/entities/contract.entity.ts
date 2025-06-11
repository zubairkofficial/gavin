import BaseEntity from '@/common/entities/BaseEntity';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()

export class Contract extends BaseEntity {
    
    @Column()
    type: string;

    @Column()
    jurisdiction: string;

    @Column()
    version_label: string;

    @Column({ type: 'text' })
    content_html: string;

    @Column()
    source: string;
}
