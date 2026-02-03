import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PricingService } from './pricing.service';
import {
  CreatePriceProfileDto,
  UpdatePriceProfileDto,
  CreatePromoPriceDto,
  UpdatePromoPriceDto,
  PriceLookupDto,
  BulkPriceUpdateDto,
} from './dto/pricing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

@Controller('pricing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  // Price Profile Endpoints
  @Get('profiles')
  async findAllPriceProfiles(@Query('variantId') variantId?: string) {
    return this.pricingService.findAllPriceProfiles(variantId);
  }

  @Get('profiles/:id')
  async findOnePriceProfile(@Param('id') id: string) {
    return this.pricingService.findOnePriceProfile(id);
  }

  @Get('profiles/variant/:variantId')
  async findByVariantId(@Param('variantId') variantId: string) {
    return this.pricingService.findByVariantId(variantId);
  }

  @Post('profiles')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async createPriceProfile(@Body() dto: CreatePriceProfileDto) {
    return this.pricingService.createPriceProfile(dto);
  }

  @Post('profiles/get-or-create')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async getOrCreate(@Body() body: { variantId: string }) {
    return this.pricingService.getOrCreate(body.variantId);
  }

  @Put('profiles/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async updatePriceProfile(@Param('id') id: string, @Body() dto: UpdatePriceProfileDto) {
    return this.pricingService.updatePriceProfile(id, dto);
  }

  @Delete('profiles/:id')
  @Roles(UserRole.ADMIN)
  async deletePriceProfile(@Param('id') id: string) {
    await this.pricingService.deletePriceProfile(id);
    return { message: 'Price profile deleted successfully' };
  }

  @Post('profiles/bulk-update')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async bulkUpdatePrices(@Body() dto: BulkPriceUpdateDto) {
    return this.pricingService.bulkUpdatePrices(dto.updates);
  }

  // Promo Price Endpoints
  @Get('promos')
  async findAllPromoPrices(
    @Query('priceProfileId') priceProfileId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.pricingService.findAllPromoPrices(priceProfileId, activeOnly === 'true');
  }

  @Get('promos/active')
  async getActivePromos(@Query('variantId') variantId?: string) {
    return this.pricingService.getActivePromos(variantId);
  }

  @Get('promos/:id')
  async findOnePromoPrice(@Param('id') id: string) {
    return this.pricingService.findOnePromoPrice(id);
  }

  @Post('promos')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async createPromoPrice(@Body() dto: CreatePromoPriceDto) {
    return this.pricingService.createPromoPrice(dto);
  }

  @Put('promos/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async updatePromoPrice(@Param('id') id: string, @Body() dto: UpdatePromoPriceDto) {
    return this.pricingService.updatePromoPrice(id, dto);
  }

  @Delete('promos/:id')
  @Roles(UserRole.ADMIN)
  async deletePromoPrice(@Param('id') id: string) {
    await this.pricingService.deletePromoPrice(id);
    return { message: 'Promo price deleted successfully' };
  }

  // Price Lookup Endpoints (Critical for POS)
  @Post('lookup')
  async getPriceForSale(@Body() dto: PriceLookupDto) {
    return this.pricingService.getPriceForSale(dto);
  }

  @Post('lookup/batch')
  async getPricesForMultipleVariants(
    @Body() body: { variantIds: string[]; isMember?: boolean; isReseller?: boolean },
  ) {
    return this.pricingService.getPricesForMultipleVariants(
      body.variantIds,
      body.isMember,
      body.isReseller,
    );
  }
}
