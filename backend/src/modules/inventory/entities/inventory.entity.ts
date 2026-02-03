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
  Unique,
} from 'typeorm';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('inventory')
@Unique(['variantId', 'branchId'])
@Index(['branchId', 'variantId'])
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'variant_id' })
  variantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'int', default: 0 })
  quantityOnHand: number;

  @Column({ type: 'int', default: 0 })
  quantityReserved: number;

  @Column({ type: 'int', default: 0 })
  reorderLevel: number;

  @Column({ type: 'int', default: 0 })
  reorderQuantity: number;

  @Column({ name: 'last_restocked_at', type: 'timestamp with time zone', nullable: true })
  lastRestockedAt: Date;

  @Column({ name: 'location_code', nullable: true })
  locationCode: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Computed properties
  get availableQuantity(): number {
    return this.quantityOnHand - this.quantityReserved;
  }

  get needsReorder(): boolean {
    return this.quantityOnHand <= this.reorderLevel;
  }
}
