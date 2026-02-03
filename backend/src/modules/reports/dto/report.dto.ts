import { IsOptional, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

export enum SalesReportType {
  SUMMARY = 'SUMMARY',
  BY_PRODUCT = 'BY_PRODUCT',
  BY_CATEGORY = 'BY_CATEGORY',
  BY_CASHIER = 'BY_CASHIER',
  BY_PAYMENT_METHOD = 'BY_PAYMENT_METHOD',
  BY_CUSTOMER_TYPE = 'BY_CUSTOMER_TYPE',
  BY_HOUR = 'BY_HOUR',
}

export class DateRangeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ReportPeriod })
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;
}

export class SalesReportQueryDto extends DateRangeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: SalesReportType, default: SalesReportType.SUMMARY })
  @IsOptional()
  @IsEnum(SalesReportType)
  type?: SalesReportType;
}

export class InventoryReportQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  lowStockOnly?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class MemberReportQueryDto extends DateRangeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;
}

export class ResellerReportQueryDto extends DateRangeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;
}

// Response DTOs

export class SalesSummaryDto {
  period: string;
  totalSales: number;
  transactionCount: number;
  averageTransaction: number;
  totalDiscount: number;
  totalTax: number;
  netSales: number;
  paymentBreakdown: {
    method: string;
    amount: number;
    count: number;
  }[];
  customerTypeBreakdown: {
    type: string;
    amount: number;
    count: number;
  }[];
}

export class ProductSalesDto {
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  quantitySold: number;
  totalRevenue: number;
  averagePrice: number;
}

export class InventorySummaryDto {
  totalProducts: number;
  totalVariants: number;
  totalQuantity: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
  lowStockItems: {
    variantId: string;
    variantName: string;
    quantity: number;
    reorderLevel: number;
  }[];
}

export class MemberSummaryDto {
  totalMembers: number;
  newMembersThisPeriod: number;
  activeMembers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  memberSales: number;
  averageMemberSpend: number;
  tierBreakdown: {
    tier: string;
    count: number;
  }[];
}

export class ResellerSummaryDto {
  totalResellers: number;
  activeResellers: number;
  totalCreditOutstanding: number;
  totalCreditLimit: number;
  overdueAccounts: number;
  resellerSales: number;
  topResellers: {
    resellerId: string;
    resellerName: string;
    totalSales: number;
    balance: number;
  }[];
}

export class DashboardSummaryDto {
  today: {
    sales: number;
    transactions: number;
    newMembers: number;
  };
  thisMonth: {
    sales: number;
    transactions: number;
    newMembers: number;
    growth: number;
  };
  lowStockAlerts: number;
  pendingSync: number;
  overduePayments: number;
}
