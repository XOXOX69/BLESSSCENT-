import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PriceProfile } from './price-profile.entity';

@Entity('promo_prices')
export class PromoPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'price_profile_id' })
  priceProfileId: string;

  @ManyToOne(() => PriceProfile, (profile) => profile.promoPrices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'price_profile_id' })
  priceProfile: PriceProfile;

  @Column()
  name: string;

  @Column({ name: 'start_date', type: 'timestamp with time zone' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp with time zone' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'discount_percent' })
  discountPercent: number;

  @Column({ default: false, name: 'is_active' })
  isActive: boolean;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false, name: 'is_member_only' })
  isMemberOnly: boolean;

  @Column({ nullable: true, name: 'promo_code' })
  promoCode: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Computed properties
  get isValid(): boolean {
    const now = new Date();
    return this.isActive && now >= this.startDate && now <= this.endDate;
  }
}
