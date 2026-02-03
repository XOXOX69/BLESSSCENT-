import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { SalesModule } from './modules/sales/sales.module';
import { MembersModule } from './modules/members/members.module';
import { ResellersModule } from './modules/resellers/resellers.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SyncModule } from './modules/sync/sync.module';
import { BranchesModule } from './modules/branches/branches.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => {
        const dbConfig = {
          type: 'postgres' as const,
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USER || process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || process.env.DB_DATABASE || 'blesscent',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          logging: process.env.NODE_ENV === 'development',
          ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        };
        console.log('Database config:', { ...dbConfig, password: '***' });
        return dbConfig;
      },
      inject: [],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    BranchesModule,
    ProductsModule,
    InventoryModule,
    PricingModule,
    SalesModule,
    MembersModule,
    ResellersModule,
    LedgerModule,
    ReportsModule,
    SyncModule,
  ],
})
export class AppModule {}
