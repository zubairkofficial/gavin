import { Column, Entity } from "typeorm";
import BaseEntity from "./common/entities/BaseEntity";

@Entity()
export class Crons extends BaseEntity{

    @Column()
    cronExpresion : string

    @Column({unique : true})
    jobName: string
}