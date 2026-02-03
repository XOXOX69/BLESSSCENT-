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
import { InventoryService } from './inventory.service';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  AdjustInventoryDto,
  InventoryFilterDto,
} from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async findAll(@Query() filter: InventoryFilterDto) {
    return this.inventoryService.findAll(filter);
  }

  @Get('low-stock')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async getLowStock(@Query('branchId') branchId?: string) {
    return this.inventoryService.getLowStockItems(branchId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Get('variant/:variantId/branch/:branchId')
  async findByVariantAndBranch(
    @Param('variantId') variantId: string,
    @Param('branchId') branchId: string,
  ) {
    return this.inventoryService.findByVariantAndBranch(variantId, branchId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async create(@Body() dto: CreateInventoryDto) {
    return this.inventoryService.create(dto);
  }

  @Post('get-or-create')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async getOrCreate(@Body() dto: { variantId: string; branchId: string }) {
    return this.inventoryService.getOrCreate(dto.variantId, dto.branchId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async update(@Param('id') id: string, @Body() dto: UpdateInventoryDto) {
    return this.inventoryService.update(id, dto);
  }

  @Post(':id/adjust')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async adjust(@Param('id') id: string, @Body() dto: AdjustInventoryDto) {
    return this.inventoryService.adjust(id, dto);
  }

  @Post(':id/reserve')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.INVENTORY)
  async reserve(@Param('id') id: string, @Body() body: { quantity: number }) {
    return this.inventoryService.reserve(id, body.quantity);
  }

  @Post(':id/release')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.INVENTORY)
  async release(@Param('id') id: string, @Body() body: { quantity: number }) {
    return this.inventoryService.release(id, body.quantity);
  }

  @Post(':id/deduct')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.INVENTORY)
  async deduct(@Param('id') id: string, @Body() body: { quantity: number }) {
    return this.inventoryService.deduct(id, body.quantity);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.inventoryService.delete(id);
    return { message: 'Inventory record deleted successfully' };
  }
}
