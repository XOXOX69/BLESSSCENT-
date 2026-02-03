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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ResellersService } from './resellers.service';
import {
  CreateResellerDto,
  UpdateResellerDto,
  AdjustCreditDto,
  RecordPaymentDto,
  ResellerQueryDto,
  ResellerLookupDto,
  ResellerStatus,
  ResellerType,
  PriceLevel,
} from './dto/reseller.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@ApiTags('resellers')
@Controller('resellers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ResellersController {
  constructor(private readonly resellersService: ResellersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new reseller' })
  @ApiResponse({ status: 201, description: 'Reseller created successfully' })
  async create(@Body() createResellerDto: CreateResellerDto) {
    return this.resellersService.create(createResellerDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get all resellers with filtering' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'status', enum: ResellerStatus, required: false })
  @ApiQuery({ name: 'type', enum: ResellerType, required: false })
  @ApiQuery({ name: 'priceLevel', enum: PriceLevel, required: false })
  @ApiQuery({ name: 'hasBalance', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  async findAll(
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
    @Query('status') status?: ResellerStatus,
    @Query('type') type?: ResellerType,
    @Query('priceLevel') priceLevel?: PriceLevel,
    @Query('hasBalance') hasBalance?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.resellersService.findAll({
      search,
      branchId,
      status,
      type,
      priceLevel,
      hasBalance: hasBalance === 'true',
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get reseller statistics' })
  @ApiQuery({ name: 'branchId', required: false })
  async getStatistics(@Query('branchId') branchId?: string) {
    return this.resellersService.getStatistics(branchId);
  }

  @Get('outstanding-balance')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get resellers with outstanding balance' })
  @ApiQuery({ name: 'branchId', required: false })
  async getWithOutstandingBalance(@Query('branchId') branchId?: string) {
    return this.resellersService.getWithOutstandingBalance(branchId);
  }

  @Post('lookup')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Lookup reseller by code, phone, or email (for POS)' })
  async lookup(@Body() lookupDto: ResellerLookupDto) {
    return this.resellersService.lookup(lookupDto);
  }

  @Get('code/:resellerCode')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get reseller by code' })
  async findByCode(@Param('resellerCode') resellerCode: string) {
    return this.resellersService.findByCode(resellerCode);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get reseller by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.resellersService.findOne(id);
  }

  @Get(':id/credit-check')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Check if reseller can make a credit purchase' })
  @ApiQuery({ name: 'amount', required: true })
  async canMakeCreditPurchase(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('amount') amount: number,
  ) {
    return this.resellersService.canMakeCreditPurchase(id, Number(amount));
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update reseller' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateResellerDto: UpdateResellerDto,
  ) {
    return this.resellersService.update(id, updateResellerDto);
  }

  @Post(':id/balance/adjust')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Adjust reseller balance' })
  async adjustBalance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() adjustDto: AdjustCreditDto,
  ) {
    return this.resellersService.adjustBalance(id, adjustDto);
  }

  @Post(':id/payment')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Record payment from reseller' })
  async recordPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() paymentDto: RecordPaymentDto,
  ) {
    return this.resellersService.recordPayment(id, paymentDto);
  }

  @Patch(':id/credit-limit')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update credit limit' })
  async updateCreditLimit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('creditLimit') creditLimit: number,
  ) {
    return this.resellersService.updateCreditLimit(id, creditLimit);
  }

  @Patch(':id/price-level')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update price level' })
  async updatePriceLevel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('priceLevel') priceLevel: PriceLevel,
  ) {
    return this.resellersService.updatePriceLevel(id, priceLevel);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Activate reseller' })
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.resellersService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Deactivate reseller' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.resellersService.deactivate(id);
  }

  @Patch(':id/suspend')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Suspend reseller' })
  async suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.resellersService.suspend(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete reseller (soft delete)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.resellersService.remove(id);
  }
}
