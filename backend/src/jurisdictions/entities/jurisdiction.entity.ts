import BaseEntity from "@/common/entities/BaseEntity";
import { Column, Entity } from "typeorm";

@Entity()
export class Jurisdiction extends BaseEntity {
    @Column()
    jurisdiction: string;

    @Column({ nullable: true })
    userId: string;
}
