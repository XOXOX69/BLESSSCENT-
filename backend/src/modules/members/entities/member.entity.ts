import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('members')
@Index(['phone'])
@Index(['email'])
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'member_code', unique: true })
  memberCode: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true, type: 'date', name: 'date_of_birth' })
  dateOfBirth: Date;

  @Column({ default: 'ACTIVE' })
  status: string;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'total_purchases' })
  totalPurchases: number;

  @Column({ name: 'member_tier', nullable: true })
  memberTier: string;

  @Column({ nullable: true, name: 'loyalty_level' })
  loyaltyLevel: string;

  @Column({ default: 'STANDARD' })
  type: string;

  @Column({ nullable: true, name: 'registered_by' })
  registeredBy: string;

  @Column({ nullable: true })
  notes: string;

  @OneToMany('Sale', 'member')
  sales: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
