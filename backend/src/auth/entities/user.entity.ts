import BaseEntity from '@/common/entities/BaseEntity';
import { UserRole } from '@/common/types';
import { IsOptional } from 'class-validator';
import { Column, Entity } from 'typeorm';

@Entity()
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 100, default: "" })
  fullName: string;

  @Column({ type: 'text', default: "" })
  profilePicture: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100, default: "" })
  password: string;

  @Column({ type: 'varchar', length: 100, default: "" })
  firmName: string;

  @Column({ type: 'varchar', length: 100, default: "" })
  companySize: string;

  @Column({nullable : true})
  credits: number;
 

  @Column({ default: false })
  isEmailVerified: boolean;
  
  @Column({ default: false })
  isActive: boolean;

  @Column({ default: false })
  isUsingGoogleAuth: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;
}
