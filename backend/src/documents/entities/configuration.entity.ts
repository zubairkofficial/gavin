import BaseEntity from '@/common/entities/BaseEntity';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Configuration extends BaseEntity {



  @Column( 'text' , {nullable : true})
  prompt: string;

  @Column({nullable : true})
  cutCredits: number;

  @Column({nullable : true})
  minTokens: number;

}
