import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { PromoPrice } from './promo-price.entity';

@Entity('price_profiles')
@Unique(['variantId'])
export class PriceProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'variant_id' })
  variantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  retailPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  memberPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'member_discount_percent' })
  memberDiscountPercent: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'reseller_price' })
  resellerPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'reseller_discount_percent' })
  resellerDiscountPercent: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'wholesale_price' })
  wholesalePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'cost_price' })
  costPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'tax_percent' })
  taxPercent: number;

  @OneToMany(() => PromoPrice, (promo: PromoPrice) => promo.priceProfile)
  promoPrices: PromoPrice[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Computed properties
  get effectiveMemberPrice(): number {
    if (this.memberPrice > 0) return Number(this.memberPrice);
    const discount = Number(this.retailPrice) * (Number(this.memberDiscountPercent) / 100);
    return Number(this.retailPrice) - discount;
  }

  get effectiveResellerPrice(): number {
    if (this.resellerPrice > 0) return Number(this.resellerPrice);
    const discount = Number(this.retailPrice) * (Number(this.resellerDiscountPercent) / 100);
    return Number(this.retailPrice) - discount;
  }
}
