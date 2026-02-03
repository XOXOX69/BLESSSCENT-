import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResellersService } from './resellers.service';
import { ResellersController } from './resellers.controller';
import { Reseller } from './entities/reseller.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reseller]),
    forwardRef(() => AuthModule),
  ],
  controllers: [ResellersController],
  providers: [ResellersService],
  exports: [ResellersService],
})
export class ResellersModule {}
