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
import { User } from '../../users/entities/user.entity';
import { Member } from '../../members/entities/member.entity';
import { Reseller } from '../../resellers/entities/reseller.entity';
import { SaleItem } from './sale-item.entity';
import { Payment } from './payment.entity';

@Entity('sales')
@Index(['branchId', 'createdAt'])
@Index(['customerId', 'customerType'])
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Polymorphic relationship: customer_id can reference either a Member or Reseller
  // based on customer_type. We don't use FK constraints here due to the polymorphic nature.
  @Column({ name: 'customer_id', nullable: true })
  customerId: string;

  @Column({ name: 'customer_type', nullable: true })
  customerType: string; // 'MEMBER' or 'RESELLER'

  // Note: These relations are defined without createForeignKeyConstraints
  // to avoid FK conflicts on the same column
  @ManyToOne(() => Member, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'customer_id' })
  member: Member;

  @ManyToOne(() => Reseller, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'customer_id' })
  reseller: Reseller;

  @Column({ name: 'receipt_number', unique: true })
  receiptNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'discount_amount' })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'tax_amount' })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'amount_paid' })
  amountPaid: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'change_due' })
  changeDue: number;

  @Column({ default: 'PENDING', name: 'payment_status' })
  paymentStatus: string;

  @Column({ default: 'COMPLETED', name: 'sale_status' })
  saleStatus: string;

  @Column({ default: 'RETAIL' })
  saleType: string;

  @Column({ default: 'POS' })
  source: string;

  @Column({ nullable: true, name: 'sync_status' })
  syncStatus: string;

  @Column({ nullable: true, name: 'offline_id' })
  offlineId: string;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => SaleItem, (item: SaleItem) => item.sale, { cascade: true })
  items: SaleItem[];

  @OneToMany(() => Payment, (payment: Payment) => payment.sale, { cascade: true })
  payments: Payment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
