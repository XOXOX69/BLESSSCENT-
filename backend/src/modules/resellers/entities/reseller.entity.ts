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

@Entity('resellers')
@Index(['email'])
@Index(['phone'])
export class Reseller {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'reseller_code', unique: true })
  resellerCode: string;

  @Column()
  company: string;

  @Column({ nullable: true, name: 'contact_person' })
  contactPerson: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ default: 'ACTIVE' })
  status: string;

  @Column({ name: 'price_level' })
  priceLevel: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'credit_limit' })
  creditLimit: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'current_balance' })
  currentBalance: number;

  @Column({ type: 'int', default: 30, name: 'credit_term_days' })
  creditTermDays: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'total_purchases' })
  totalPurchases: number;

  @Column({ default: 'STANDARD' })
  type: string;

  @Column({ nullable: true, name: 'tax_id' })
  taxId: string;

  @Column({ nullable: true })
  notes: string;

  @OneToMany('Sale', 'reseller')
  sales: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
