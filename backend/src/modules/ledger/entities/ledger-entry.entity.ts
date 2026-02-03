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
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Reseller } from '../../resellers/entities/reseller.entity';
import { User } from '../../users/entities/user.entity';

export enum LedgerEntryType {
  CREDIT_SALE = 'CREDIT_SALE',       // Reseller purchased on credit
  PAYMENT = 'PAYMENT',               // Reseller made a payment
  ADJUSTMENT = 'ADJUSTMENT',         // Manual adjustment
  REFUND = 'REFUND',                 // Refund to reseller
  CREDIT_NOTE = 'CREDIT_NOTE',       // Credit note issued
  DEBIT_NOTE = 'DEBIT_NOTE',         // Debit note issued
}

export enum LedgerEntryStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REVERSED = 'REVERSED',
}

@Entity('ledger_entries')
@Index(['resellerId', 'createdAt'])
@Index(['branchId', 'createdAt'])
@Index(['entryType', 'createdAt'])
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'reseller_id' })
  resellerId: string;

  @ManyToOne(() => Reseller, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reseller_id' })
  reseller: Reseller;

  @Column({ name: 'entry_number', unique: true })
  entryNumber: string;

  @Column({
    name: 'entry_type',
    type: 'varchar',
    default: LedgerEntryType.CREDIT_SALE,
  })
  entryType: LedgerEntryType;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  credit: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'running_balance' })
  runningBalance: number;

  @Column({ name: 'reference_type', nullable: true })
  referenceType: string; // 'SALE', 'PAYMENT', 'MANUAL'

  @Column({ name: 'reference_id', nullable: true })
  referenceId: string; // Sale ID or Payment ID

  @Column({ nullable: true })
  description: string;

  @Column({
    name: 'status',
    type: 'varchar',
    default: LedgerEntryStatus.COMPLETED,
  })
  status: LedgerEntryStatus;

  @Column({ name: 'payment_method', nullable: true })
  paymentMethod: string;

  @Column({ name: 'payment_reference', nullable: true })
  paymentReference: string;

  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
