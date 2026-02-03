import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { PriceProfile } from './entities/price-profile.entity';
import { PromoPrice } from './entities/promo-price.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PriceProfile, PromoPrice, ProductVariant]),
    forwardRef(() => AuthModule),
  ],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
