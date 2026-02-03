import {
  Controller,
  Get,
  Post,
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
import { LedgerService } from './ledger.service';
import {
  CreateCreditSaleEntryDto,
  CreatePaymentEntryDto,
  CreateAdjustmentEntryDto,
  LedgerQueryDto,
  ResellerStatementDto,
} from './dto/ledger.dto';
import { LedgerEntryType, LedgerEntryStatus } from './entities/ledger-entry.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('ledger')
@Controller('ledger')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Post('credit-sale')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Record a credit sale entry' })
  @ApiResponse({ status: 201, description: 'Credit sale recorded successfully' })
  async recordCreditSale(
    @Body() dto: CreateCreditSaleEntryDto,
    @CurrentUser() user: any,
  ) {
    return this.ledgerService.recordCreditSale({
      ...dto,
      createdBy: dto.createdBy || user?.id,
    });
  }

  @Post('payment')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Record a payment entry' })
  @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
  async recordPayment(
    @Body() dto: CreatePaymentEntryDto,
    @CurrentUser() user: any,
  ) {
    return this.ledgerService.recordPayment({
      ...dto,
      createdBy: dto.createdBy || user?.id,
    });
  }

  @Post('adjustment')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Record an adjustment entry' })
  @ApiResponse({ status: 201, description: 'Adjustment recorded successfully' })
  async recordAdjustment(
    @Body() dto: CreateAdjustmentEntryDto,
    @CurrentUser() user: any,
  ) {
    return this.ledgerService.recordAdjustment({
      ...dto,
      createdBy: dto.createdBy || user?.id,
    });
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all ledger entries with filtering' })
  @ApiQuery({ name: 'resellerId', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'entryType', enum: LedgerEntryType, required: false })
  @ApiQuery({ name: 'status', enum: LedgerEntryStatus, required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  async findAll(
    @Query('resellerId') resellerId?: string,
    @Query('branchId') branchId?: string,
    @Query('entryType') entryType?: LedgerEntryType,
    @Query('status') status?: LedgerEntryStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.ledgerService.findAll({
      resellerId,
      branchId,
      entryType,
      status,
      startDate,
      endDate,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Get('balance/:resellerId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get current balance for a reseller' })
  async getCurrentBalance(@Param('resellerId', ParseUUIDPipe) resellerId: string) {
    const balance = await this.ledgerService.getCurrentBalance(resellerId);
    return { resellerId, balance };
  }

  @Post('statement')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get reseller account statement' })
  async getResellerStatement(@Body() dto: ResellerStatementDto) {
    return this.ledgerService.getResellerStatement(dto);
  }

  @Get('overdue')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get overdue entries' })
  @ApiQuery({ name: 'branchId', required: false })
  async getOverdueEntries(@Query('branchId') branchId?: string) {
    return this.ledgerService.getOverdueEntries(branchId);
  }

  @Get('aging-report')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get aging report for receivables' })
  @ApiQuery({ name: 'branchId', required: false })
  async getAgingReport(@Query('branchId') branchId?: string) {
    return this.ledgerService.getAgingReport(branchId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get ledger entry by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ledgerService.findOne(id);
  }
}
