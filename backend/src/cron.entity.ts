import { Column, Entity } from "typeorm";
import BaseEntity from "./common/entities/BaseEntity";

@Entity()
export class Cron extends BaseEntity{

    @Column()
    cronExpresion : string

    @Column()
    jobName: string
}