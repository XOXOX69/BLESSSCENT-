import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Member } from '../members/entities/member.entity';
import { Reseller } from '../resellers/entities/reseller.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { LedgerEntry } from '../ledger/entities/ledger-entry.entity';
import {
  SalesReportQueryDto,
  InventoryReportQueryDto,
  MemberReportQueryDto,
  ResellerReportQueryDto,
  SalesReportType,
  ReportPeriod,
  SalesSummaryDto,
  InventorySummaryDto,
  MemberSummaryDto,
  ResellerSummaryDto,
  DashboardSummaryDto,
} from './dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    @InjectRepository(Reseller)
    private readonly resellerRepository: Repository<Reseller>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerRepository: Repository<LedgerEntry>,
  ) {}

  /**
   * Get date range based on period
   */
  private getDateRange(dto: { startDate?: string; endDate?: string; period?: ReportPeriod }) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.setHours(23, 59, 59, 999));

    if (dto.startDate && dto.endDate) {
      startDate = new Date(dto.startDate);
      endDate = new Date(dto.endDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      switch (dto.period) {
        case ReportPeriod.DAILY:
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case ReportPeriod.WEEKLY:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
        case ReportPeriod.MONTHLY:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case ReportPeriod.QUARTERLY:
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case ReportPeriod.YEARLY:
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.setHours(0, 0, 0, 0));
      }
    }

    return { startDate, endDate };
  }

  /**
   * Sales Summary Report
   */
  async getSalesSummary(query: SalesReportQueryDto): Promise<SalesSummaryDto> {
    const { startDate, endDate } = this.getDateRange(query);

    const salesQuery = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.payments', 'payments')
      .where('sale.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('sale.deletedAt IS NULL')
      .andWhere('sale.saleStatus = :status', { status: 'COMPLETED' });

    if (query.branchId) {
      salesQuery.andWhere('sale.branchId = :branchId', { branchId: query.branchId });
    }

    const sales = await salesQuery.getMany();

    const totalSales = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const totalDiscount = sales.reduce((sum, s) => sum + Number(s.discountAmount || 0), 0);
    const totalTax = sales.reduce((sum, s) => sum + Number(s.taxAmount || 0), 0);

    // Payment breakdown
    const paymentMap = new Map<string, { amount: number; count: number }>();
    for (const sale of sales) {
      if (sale.payments) {
        for (const payment of sale.payments) {
          const method = payment.paymentMethod;
          const existing = paymentMap.get(method) || { amount: 0, count: 0 };
          existing.amount += Number(payment.amount);
          existing.count += 1;
          paymentMap.set(method, existing);
        }
      }
    }

    // Customer type breakdown
    const customerTypeMap = new Map<string, { amount: number; count: number }>();
    for (const sale of sales) {
      const type = sale.customerType || 'RETAIL';
      const existing = customerTypeMap.get(type) || { amount: 0, count: 0 };
      existing.amount += Number(sale.totalAmount);
      existing.count += 1;
      customerTypeMap.set(type, existing);
    }

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      totalSales,
      transactionCount: sales.length,
      averageTransaction: sales.length > 0 ? totalSales / sales.length : 0,
      totalDiscount,
      totalTax,
      netSales: totalSales - totalTax,
      paymentBreakdown: Array.from(paymentMap.entries()).map(([method, data]) => ({
        method,
        amount: data.amount,
        count: data.count,
      })),
      customerTypeBreakdown: Array.from(customerTypeMap.entries()).map(([type, data]) => ({
        type,
        amount: data.amount,
        count: data.count,
      })),
    };
  }

  /**
   * Sales by Product Report
   */
  async getSalesByProduct(query: SalesReportQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    const itemsQuery = this.saleItemRepository
      .createQueryBuilder('item')
      .leftJoin('item.sale', 'sale')
      .leftJoinAndSelect('item.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .select([
        'item.variantId as "variantId"',
        'variant.name as "variantName"',
        'product.name as "productName"',
        'SUM(item.quantity) as "quantitySold"',
        'SUM(item.total) as "totalRevenue"',
        'AVG(item.unitPrice) as "averagePrice"',
      ])
      .where('sale.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('sale.deletedAt IS NULL')
      .groupBy('item.variantId')
      .addGroupBy('variant.name')
      .addGroupBy('product.name');

    if (query.branchId) {
      itemsQuery.andWhere('sale.branchId = :branchId', { branchId: query.branchId });
    }

    return itemsQuery.getRawMany();
  }

  /**
   * Inventory Summary Report
   */
  async getInventorySummary(query: InventoryReportQueryDto): Promise<InventorySummaryDto> {
    const inventoryQuery = this.inventoryRepository
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .where('inv.deletedAt IS NULL');

    if (query.branchId) {
      inventoryQuery.andWhere('inv.branchId = :branchId', { branchId: query.branchId });
    }

    const inventory = await inventoryQuery.getMany();

    const totalQuantity = inventory.reduce((sum, i) => sum + Number(i.quantityOnHand), 0);
    const lowStockItems = inventory.filter(i => i.quantityOnHand <= i.reorderLevel && i.quantityOnHand > 0);
    const outOfStock = inventory.filter(i => i.quantityOnHand <= 0);

    // Calculate total value (quantity * cost price) - skip priceProfile which requires join
    let totalValue = 0;
    // Note: Would need to join priceProfile to calculate value

    return {
      totalProducts: new Set(inventory.map(i => i.variant?.productId)).size,
      totalVariants: inventory.length,
      totalQuantity,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStock.length,
      totalValue,
      lowStockItems: lowStockItems.slice(0, 20).map(i => ({
        variantId: i.variantId,
        variantName: i.variant?.name || 'Unknown',
        quantity: i.quantityOnHand,
        reorderLevel: i.reorderLevel,
      })),
    };
  }

  /**
   * Member Summary Report
   */
  async getMemberSummary(query: MemberReportQueryDto): Promise<MemberSummaryDto> {
    const { startDate, endDate } = this.getDateRange(query);

    const memberQuery = this.memberRepository
      .createQueryBuilder('member')
      .where('member.deletedAt IS NULL');

    if (query.branchId) {
      memberQuery.andWhere('member.branchId = :branchId', { branchId: query.branchId });
    }

    const members = await memberQuery.getMany();
    const newMembers = members.filter(m => 
      m.createdAt >= startDate && m.createdAt <= endDate
    );
    const activeMembers = members.filter(m => m.status === 'ACTIVE');

    // Tier breakdown
    const tierMap = new Map<string, number>();
    for (const member of members) {
      const tier = member.memberTier || 'BRONZE';
      tierMap.set(tier, (tierMap.get(tier) || 0) + 1);
    }

    // Get member sales
    const salesQuery = this.saleRepository
      .createQueryBuilder('sale')
      .select('COALESCE(SUM(sale.totalAmount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('sale.customerType = :type', { type: 'MEMBER' })
      .andWhere('sale.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('sale.deletedAt IS NULL');

    if (query.branchId) {
      salesQuery.andWhere('sale.branchId = :branchId', { branchId: query.branchId });
    }

    const salesData = await salesQuery.getRawOne();
    const memberSales = parseFloat(salesData.total) || 0;
    const memberTransactions = parseInt(salesData.count) || 0;

    return {
      totalMembers: members.length,
      newMembersThisPeriod: newMembers.length,
      activeMembers: activeMembers.length,
      totalPointsIssued: members.reduce((sum, m) => sum + Number(m.totalPurchases || 0), 0),
      totalPointsRedeemed: members.reduce((sum, m) => sum + Number(m.totalPurchases || 0) - Number(m.points || 0), 0),
      memberSales,
      averageMemberSpend: memberTransactions > 0 ? memberSales / memberTransactions : 0,
      tierBreakdown: Array.from(tierMap.entries()).map(([tier, count]) => ({ tier, count })),
    };
  }

  /**
   * Reseller Summary Report
   */
  async getResellerSummary(query: ResellerReportQueryDto): Promise<ResellerSummaryDto> {
    const { startDate, endDate } = this.getDateRange(query);

    const resellerQuery = this.resellerRepository
      .createQueryBuilder('reseller')
      .where('reseller.deletedAt IS NULL');

    if (query.branchId) {
      resellerQuery.andWhere('reseller.branchId = :branchId', { branchId: query.branchId });
    }

    const resellers = await resellerQuery.getMany();
    const activeResellers = resellers.filter(r => r.status === 'ACTIVE');
    const totalCreditLimit = resellers.reduce((sum, r) => sum + Number(r.creditLimit || 0), 0);
    const totalOutstanding = resellers.reduce((sum, r) => sum + Number(r.currentBalance || 0), 0);

    // Get overdue accounts (ledger entries with due dates in past)
    const overdueQuery = this.ledgerRepository
      .createQueryBuilder('entry')
      .select('COUNT(DISTINCT entry.resellerId)', 'count')
      .where('entry.dueDate < :now', { now: new Date() })
      .andWhere('entry.entryType = :type', { type: 'CREDIT_SALE' })
      .andWhere('entry.runningBalance > 0');

    const overdueData = await overdueQuery.getRawOne();
    const overdueAccounts = parseInt(overdueData.count) || 0;

    // Get reseller sales
    const salesQuery = this.saleRepository
      .createQueryBuilder('sale')
      .select('COALESCE(SUM(sale.totalAmount), 0)', 'total')
      .where('sale.customerType = :type', { type: 'RESELLER' })
      .andWhere('sale.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('sale.deletedAt IS NULL');

    if (query.branchId) {
      salesQuery.andWhere('sale.branchId = :branchId', { branchId: query.branchId });
    }

    const salesData = await salesQuery.getRawOne();
    const resellerSales = parseFloat(salesData.total) || 0;

    // Top resellers by sales
    const topResellersQuery = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoin('sale.reseller', 'reseller')
      .select([
        'sale.customerId as "resellerId"',
        'reseller.company as "resellerName"',
        'SUM(sale.totalAmount) as "totalSales"',
        'reseller.currentBalance as "balance"',
      ])
      .where('sale.customerType = :type', { type: 'RESELLER' })
      .andWhere('sale.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('sale.deletedAt IS NULL')
      .groupBy('sale.customerId')
      .addGroupBy('reseller.company')
      .addGroupBy('reseller.currentBalance')
      .orderBy('"totalSales"', 'DESC')
      .limit(10);

    const topResellers = await topResellersQuery.getRawMany();

    return {
      totalResellers: resellers.length,
      activeResellers: activeResellers.length,
      totalCreditOutstanding: totalOutstanding,
      totalCreditLimit,
      overdueAccounts,
      resellerSales,
      topResellers: topResellers.map(r => ({
        resellerId: r.resellerId,
        resellerName: r.resellerName || 'Unknown',
        totalSales: parseFloat(r.totalSales) || 0,
        balance: parseFloat(r.balance) || 0,
      })),
    };
  }

  /**
   * Dashboard Summary
   */
  async getDashboard(branchId?: string): Promise<DashboardSummaryDto> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Today's stats
    const todaySalesQuery = this.saleRepository
      .createQueryBuilder('sale')
      .select('COALESCE(SUM(sale.totalAmount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('sale.createdAt BETWEEN :start AND :end', { start: startOfToday, end: endOfToday })
      .andWhere('sale.deletedAt IS NULL');

    if (branchId) {
      todaySalesQuery.andWhere('sale.branchId = :branchId', { branchId });
    }

    const todaySales = await todaySalesQuery.getRawOne();

    // This month's stats
    const monthSalesQuery = this.saleRepository
      .createQueryBuilder('sale')
      .select('COALESCE(SUM(sale.totalAmount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('sale.createdAt BETWEEN :start AND :end', { start: startOfMonth, end: endOfToday })
      .andWhere('sale.deletedAt IS NULL');

    if (branchId) {
      monthSalesQuery.andWhere('sale.branchId = :branchId', { branchId });
    }

    const monthSales = await monthSalesQuery.getRawOne();

    // Last month's stats for growth calculation
    const lastMonthSalesQuery = this.saleRepository
      .createQueryBuilder('sale')
      .select('COALESCE(SUM(sale.totalAmount), 0)', 'total')
      .where('sale.createdAt BETWEEN :start AND :end', { start: startOfLastMonth, end: endOfLastMonth })
      .andWhere('sale.deletedAt IS NULL');

    if (branchId) {
      lastMonthSalesQuery.andWhere('sale.branchId = :branchId', { branchId });
    }

    const lastMonthSales = await lastMonthSalesQuery.getRawOne();
    const lastMonthTotal = parseFloat(lastMonthSales.total) || 0;
    const thisMonthTotal = parseFloat(monthSales.total) || 0;
    const growth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    // New members today
    const newMembersQuery = this.memberRepository
      .createQueryBuilder('member')
      .where('member.createdAt BETWEEN :start AND :end', { start: startOfToday, end: endOfToday });

    if (branchId) {
      newMembersQuery.andWhere('member.branchId = :branchId', { branchId });
    }

    const newMembersToday = await newMembersQuery.getCount();

    // New members this month
    const newMembersMonthQuery = this.memberRepository
      .createQueryBuilder('member')
      .where('member.createdAt BETWEEN :start AND :end', { start: startOfMonth, end: endOfToday });

    if (branchId) {
      newMembersMonthQuery.andWhere('member.branchId = :branchId', { branchId });
    }

    const newMembersMonth = await newMembersMonthQuery.getCount();

    // Low stock alerts
    const lowStockQuery = this.inventoryRepository
      .createQueryBuilder('inv')
      .where('inv.quantityOnHand <= inv.reorderLevel')
      .andWhere('inv.deletedAt IS NULL');

    if (branchId) {
      lowStockQuery.andWhere('inv.branchId = :branchId', { branchId });
    }

    const lowStockCount = await lowStockQuery.getCount();

    // Overdue payments
    const overdueQuery = this.ledgerRepository
      .createQueryBuilder('entry')
      .where('entry.dueDate < :now', { now })
      .andWhere('entry.entryType = :type', { type: 'CREDIT_SALE' })
      .andWhere('entry.runningBalance > 0');

    const overdueCount = await overdueQuery.getCount();

    return {
      today: {
        sales: parseFloat(todaySales.total) || 0,
        transactions: parseInt(todaySales.count) || 0,
        newMembers: newMembersToday,
      },
      thisMonth: {
        sales: thisMonthTotal,
        transactions: parseInt(monthSales.count) || 0,
        newMembers: newMembersMonth,
        growth: Math.round(growth * 100) / 100,
      },
      lowStockAlerts: lowStockCount,
      pendingSync: 0, // TODO: Add sync status tracking
      overduePayments: overdueCount,
    };
  }

  /**
   * Hourly Sales Report
   */
  async getHourlySales(query: SalesReportQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    const hourlyQuery = this.saleRepository
      .createQueryBuilder('sale')
      .select('EXTRACT(HOUR FROM sale.createdAt)', 'hour')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(sale.totalAmount), 0)', 'total')
      .where('sale.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('sale.deletedAt IS NULL')
      .groupBy('EXTRACT(HOUR FROM sale.createdAt)')
      .orderBy('"hour"', 'ASC');

    if (query.branchId) {
      hourlyQuery.andWhere('sale.branchId = :branchId', { branchId: query.branchId });
    }

    const hourlyData = await hourlyQuery.getRawMany();

    // Fill in all hours
    const result = [];
    for (let hour = 0; hour < 24; hour++) {
      const data = hourlyData.find(h => parseInt(h.hour) === hour);
      result.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        transactions: data ? parseInt(data.count) : 0,
        sales: data ? parseFloat(data.total) : 0,
      });
    }

    return result;
  }
}
