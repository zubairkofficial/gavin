import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Contract {
    @PrimaryGeneratedColumn()
    id: number;

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
