import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import {
  SalesReportQueryDto,
  InventoryReportQueryDto,
  MemberReportQueryDto,
  ResellerReportQueryDto,
} from './dto/report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get dashboard summary' })
  @ApiQuery({ name: 'branchId', required: false })
  async getDashboard(@Query('branchId') branchId?: string) {
    return this.reportsService.getDashboard(branchId);
  }

  @Get('sales/summary')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get sales summary report' })
  async getSalesSummary(@Query() query: SalesReportQueryDto) {
    return this.reportsService.getSalesSummary(query);
  }

  @Get('sales/by-product')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get sales by product report' })
  async getSalesByProduct(@Query() query: SalesReportQueryDto) {
    return this.reportsService.getSalesByProduct(query);
  }

  @Get('sales/hourly')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get hourly sales report' })
  async getHourlySales(@Query() query: SalesReportQueryDto) {
    return this.reportsService.getHourlySales(query);
  }

  @Get('inventory')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  @ApiOperation({ summary: 'Get inventory summary report' })
  async getInventorySummary(@Query() query: InventoryReportQueryDto) {
    return this.reportsService.getInventorySummary(query);
  }

  @Get('members')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get member summary report' })
  async getMemberSummary(@Query() query: MemberReportQueryDto) {
    return this.reportsService.getMemberSummary(query);
  }

  @Get('resellers')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get reseller summary report' })
  async getResellerSummary(@Query() query: ResellerReportQueryDto) {
    return this.reportsService.getResellerSummary(query);
  }
}
