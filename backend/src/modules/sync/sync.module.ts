import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncLog } from './entities/sync-log.entity';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { AuthModule } from '../auth/auth.module';
import { SalesModule } from '../sales/sales.module';
import { MembersModule } from '../members/members.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductsModule } from '../products/products.module';
import { PricingModule } from '../pricing/pricing.module';
import { ResellersModule } from '../resellers/resellers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SyncLog]),
    forwardRef(() => AuthModule),
    forwardRef(() => SalesModule),
    forwardRef(() => MembersModule),
    forwardRef(() => InventoryModule),
    forwardRef(() => ProductsModule),
    forwardRef(() => PricingModule),
    forwardRef(() => ResellersModule),
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
