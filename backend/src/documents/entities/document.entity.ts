import BaseEntity from '@/common/entities/BaseEntity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Document extends BaseEntity{

    @Column()
    title: string;

    @Column()
    fileName: string;

    @Column()
    type: string;

    @Column()
    content: string;
}
