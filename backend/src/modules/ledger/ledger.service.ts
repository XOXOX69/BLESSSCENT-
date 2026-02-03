import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { LedgerEntry, LedgerEntryType, LedgerEntryStatus } from './entities/ledger-entry.entity';
import { ResellersService } from '../resellers/resellers.service';
import {
  CreateCreditSaleEntryDto,
  CreatePaymentEntryDto,
  CreateAdjustmentEntryDto,
  LedgerQueryDto,
  ResellerStatementDto,
} from './dto/ledger.dto';

@Injectable()
export class LedgerService {
  constructor(
    @InjectRepository(LedgerEntry)
    private readonly ledgerRepository: Repository<LedgerEntry>,
    private readonly resellersService: ResellersService,
  ) {}

  /**
   * Generate unique entry number
   */
  private async generateEntryNumber(type: LedgerEntryType): Promise<string> {
    const prefix = type === LedgerEntryType.PAYMENT ? 'PAY' : 
                   type === LedgerEntryType.CREDIT_SALE ? 'INV' : 'ADJ';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const count = await this.ledgerRepository.count({
      where: {
        entryType: type,
      },
    });
    
    const sequence = (count + 1).toString().padStart(6, '0');
    return `${prefix}${year}${month}${day}-${sequence}`;
  }

  /**
   * Get current balance for reseller
   */
  async getCurrentBalance(resellerId: string): Promise<number> {
    const lastEntry = await this.ledgerRepository.findOne({
      where: { resellerId },
      order: { createdAt: 'DESC' },
    });

    return lastEntry ? Number(lastEntry.runningBalance) : 0;
  }

  /**
   * Record a credit sale (debit entry - increases balance)
   */
  async recordCreditSale(dto: CreateCreditSaleEntryDto): Promise<LedgerEntry> {
    // Verify reseller exists and can make credit purchase
    const creditCheck = await this.resellersService.canMakeCreditPurchase(dto.resellerId, dto.amount);
    if (!creditCheck.allowed) {
      throw new BadRequestException(creditCheck.reason);
    }

    const currentBalance = await this.getCurrentBalance(dto.resellerId);
    const newBalance = currentBalance + dto.amount;

    const entryNumber = await this.generateEntryNumber(LedgerEntryType.CREDIT_SALE);

    // Calculate due date based on reseller credit terms
    const reseller = await this.resellersService.findOne(dto.resellerId);
    const dueDate = dto.dueDate 
      ? new Date(dto.dueDate) 
      : new Date(Date.now() + reseller.creditTermDays * 24 * 60 * 60 * 1000);

    const entry = this.ledgerRepository.create({
      branchId: dto.branchId,
      resellerId: dto.resellerId,
      entryNumber,
      entryType: LedgerEntryType.CREDIT_SALE,
      debit: dto.amount,
      credit: 0,
      runningBalance: newBalance,
      referenceType: 'SALE',
      referenceId: dto.saleId,
      description: dto.description || `Credit sale - ${entryNumber}`,
      dueDate,
      createdBy: dto.createdBy,
      status: LedgerEntryStatus.COMPLETED,
    });

    const savedEntry = await this.ledgerRepository.save(entry);

    // Update reseller balance
    await this.resellersService.addPurchase(dto.resellerId, dto.amount);

    return savedEntry;
  }

  /**
   * Record a payment (credit entry - reduces balance)
   */
  async recordPayment(dto: CreatePaymentEntryDto): Promise<LedgerEntry> {
    const currentBalance = await this.getCurrentBalance(dto.resellerId);
    
    if (dto.amount > currentBalance) {
      throw new BadRequestException(`Payment amount exceeds current balance of ₱${currentBalance.toFixed(2)}`);
    }

    const newBalance = currentBalance - dto.amount;

    const entryNumber = await this.generateEntryNumber(LedgerEntryType.PAYMENT);

    const entry = this.ledgerRepository.create({
      branchId: dto.branchId,
      resellerId: dto.resellerId,
      entryNumber,
      entryType: LedgerEntryType.PAYMENT,
      debit: 0,
      credit: dto.amount,
      runningBalance: newBalance,
      referenceType: 'PAYMENT',
      description: dto.description || `Payment received - ${dto.paymentMethod}`,
      paymentMethod: dto.paymentMethod,
      paymentReference: dto.paymentReference,
      createdBy: dto.createdBy,
      notes: dto.notes,
      status: LedgerEntryStatus.COMPLETED,
    });

    const savedEntry = await this.ledgerRepository.save(entry);

    // Update reseller balance
    await this.resellersService.recordPayment(dto.resellerId, {
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      referenceNumber: dto.paymentReference,
      notes: dto.notes,
    });

    return savedEntry;
  }

  /**
   * Record an adjustment (debit or credit)
   */
  async recordAdjustment(dto: CreateAdjustmentEntryDto): Promise<LedgerEntry> {
    const currentBalance = await this.getCurrentBalance(dto.resellerId);
    
    const debit = dto.adjustmentType === 'DEBIT' ? dto.amount : 0;
    const credit = dto.adjustmentType === 'CREDIT' ? dto.amount : 0;
    const newBalance = currentBalance + debit - credit;

    if (newBalance < 0) {
      throw new BadRequestException('Adjustment would result in negative balance');
    }

    const entryNumber = await this.generateEntryNumber(LedgerEntryType.ADJUSTMENT);

    const entry = this.ledgerRepository.create({
      branchId: dto.branchId,
      resellerId: dto.resellerId,
      entryNumber,
      entryType: LedgerEntryType.ADJUSTMENT,
      debit,
      credit,
      runningBalance: newBalance,
      referenceType: 'MANUAL',
      description: dto.reason,
      createdBy: dto.createdBy,
      notes: dto.notes,
      status: LedgerEntryStatus.COMPLETED,
    });

    const savedEntry = await this.ledgerRepository.save(entry);

    // Update reseller balance
    await this.resellersService.adjustBalance(dto.resellerId, {
      amount: dto.adjustmentType === 'DEBIT' ? dto.amount : -dto.amount,
      reason: dto.reason,
    });

    return savedEntry;
  }

  /**
   * Get all ledger entries with filtering
   */
  async findAll(query: LedgerQueryDto): Promise<{ data: LedgerEntry[]; total: number }> {
    const queryBuilder = this.ledgerRepository.createQueryBuilder('entry');

    if (query.resellerId) {
      queryBuilder.andWhere('entry.resellerId = :resellerId', { resellerId: query.resellerId });
    }
    if (query.branchId) {
      queryBuilder.andWhere('entry.branchId = :branchId', { branchId: query.branchId });
    }
    if (query.entryType) {
      queryBuilder.andWhere('entry.entryType = :entryType', { entryType: query.entryType });
    }
    if (query.status) {
      queryBuilder.andWhere('entry.status = :status', { status: query.status });
    }
    if (query.startDate) {
      queryBuilder.andWhere('entry.createdAt >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      queryBuilder.andWhere('entry.createdAt <= :endDate', { endDate: query.endDate });
    }

    queryBuilder
      .leftJoinAndSelect('entry.reseller', 'reseller')
      .leftJoinAndSelect('entry.branch', 'branch')
      .orderBy('entry.createdAt', 'DESC')
      .skip(query.skip || 0)
      .take(query.take || 50);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  /**
   * Get entry by ID
   */
  async findOne(id: string): Promise<LedgerEntry> {
    const entry = await this.ledgerRepository.findOne({
      where: { id },
      relations: ['reseller', 'branch', 'createdByUser'],
    });

    if (!entry) {
      throw new NotFoundException(`Ledger entry with ID ${id} not found`);
    }

    return entry;
  }

  /**
   * Get reseller statement (account history)
   */
  async getResellerStatement(dto: ResellerStatementDto): Promise<{
    reseller: any;
    openingBalance: number;
    entries: LedgerEntry[];
    closingBalance: number;
    totalDebits: number;
    totalCredits: number;
  }> {
    const reseller = await this.resellersService.findOne(dto.resellerId);

    const queryBuilder = this.ledgerRepository.createQueryBuilder('entry')
      .where('entry.resellerId = :resellerId', { resellerId: dto.resellerId })
      .orderBy('entry.createdAt', 'ASC');

    if (dto.startDate) {
      queryBuilder.andWhere('entry.createdAt >= :startDate', { startDate: dto.startDate });
    }
    if (dto.endDate) {
      queryBuilder.andWhere('entry.createdAt <= :endDate', { endDate: dto.endDate });
    }

    const entries = await queryBuilder.getMany();

    // Calculate opening balance (balance before start date)
    let openingBalance = 0;
    if (dto.startDate) {
      const beforeEntry = await this.ledgerRepository.findOne({
        where: {
          resellerId: dto.resellerId,
          createdAt: LessThanOrEqual(new Date(dto.startDate)),
        },
        order: { createdAt: 'DESC' },
      });
      openingBalance = beforeEntry ? Number(beforeEntry.runningBalance) : 0;
    }

    const totalDebits = entries.reduce((sum, e) => sum + Number(e.debit), 0);
    const totalCredits = entries.reduce((sum, e) => sum + Number(e.credit), 0);
    const closingBalance = entries.length > 0 
      ? Number(entries[entries.length - 1].runningBalance) 
      : openingBalance;

    return {
      reseller: {
        id: reseller.id,
        resellerCode: reseller.resellerCode,
        company: reseller.company,
        contactPerson: reseller.contactPerson,
      },
      openingBalance,
      entries,
      closingBalance,
      totalDebits,
      totalCredits,
    };
  }

  /**
   * Get overdue entries
   */
  async getOverdueEntries(branchId?: string): Promise<LedgerEntry[]> {
    const queryBuilder = this.ledgerRepository.createQueryBuilder('entry')
      .where('entry.entryType = :type', { type: LedgerEntryType.CREDIT_SALE })
      .andWhere('entry.dueDate < :now', { now: new Date() })
      .andWhere('entry.runningBalance > 0');

    if (branchId) {
      queryBuilder.andWhere('entry.branchId = :branchId', { branchId });
    }

    queryBuilder
      .leftJoinAndSelect('entry.reseller', 'reseller')
      .orderBy('entry.dueDate', 'ASC');

    return queryBuilder.getMany();
  }

  /**
   * Get aging report for receivables
   */
  async getAgingReport(branchId?: string): Promise<{
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    over90: number;
    total: number;
  }> {
    const now = new Date();
    const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const day60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const day90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const resellers = await this.resellersService.getWithOutstandingBalance(branchId);

    let current = 0;
    let days1to30 = 0;
    let days31to60 = 0;
    let days61to90 = 0;
    let over90 = 0;

    for (const reseller of resellers) {
      const entries = await this.ledgerRepository.find({
        where: {
          resellerId: reseller.id,
          entryType: LedgerEntryType.CREDIT_SALE,
        },
        order: { createdAt: 'ASC' },
      });

      for (const entry of entries) {
        const entryDate = new Date(entry.createdAt);
        const balance = Number(entry.debit);

        if (entryDate > day30) {
          current += balance;
        } else if (entryDate > day60) {
          days1to30 += balance;
        } else if (entryDate > day90) {
          days31to60 += balance;
        } else if (entryDate > new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)) {
          days61to90 += balance;
        } else {
          over90 += balance;
        }
      }
    }

    return {
      current,
      days1to30,
      days31to60,
      days61to90,
      over90,
      total: current + days1to30 + days31to60 + days61to90 + over90,
    };
  }
}
