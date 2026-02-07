import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, MoreThan } from 'typeorm';
import { Reseller } from './entities/reseller.entity';
import {
  CreateResellerDto,
  UpdateResellerDto,
  AdjustCreditDto,
  RecordPaymentDto,
  ResellerQueryDto,
  ResellerLookupDto,
  ResellerStatus,
  PriceLevel,
} from './dto/reseller.dto';

@Injectable()
export class ResellersService {
  constructor(
    @InjectRepository(Reseller)
    private readonly resellerRepository: Repository<Reseller>,
  ) {}

  /**
   * Generate unique reseller code
   */
  private async generateResellerCode(branchId: string): Promise<string> {
    const prefix = 'RSL';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    const count = await this.resellerRepository.count({
      where: {
        resellerCode: Like(`${prefix}${year}${month}%`),
      },
    });
    
    const sequence = (count + 1).toString().padStart(4, '0');
    return `${prefix}${year}${month}${sequence}`;
  }

  /**
   * Get discount percentage based on price level
   */
  getDiscountForPriceLevel(priceLevel: PriceLevel): number {
    switch (priceLevel) {
      case PriceLevel.LEVEL_1:
        return 10; // 10% discount
      case PriceLevel.LEVEL_2:
        return 20; // 20% discount
      case PriceLevel.LEVEL_3:
        return 30; // 30% discount
      case PriceLevel.WHOLESALE:
        return 40; // 40% discount
      default:
        return 0;
    }
  }

  /**
   * Create a new reseller
   */
  async create(createResellerDto: CreateResellerDto): Promise<Reseller> {
    // Check for existing reseller with same email or phone
    if (createResellerDto.email) {
      const existingEmail = await this.resellerRepository.findOne({
        where: { email: createResellerDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Reseller with this email already exists');
      }
    }

    if (createResellerDto.phone) {
      const existingPhone = await this.resellerRepository.findOne({
        where: { phone: createResellerDto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('Reseller with this phone already exists');
      }
    }

    const resellerCode = await this.generateResellerCode(createResellerDto.branchId);

    const reseller = this.resellerRepository.create({
      ...createResellerDto,
      resellerCode,
      status: ResellerStatus.ACTIVE,
      currentBalance: 0,
      totalPurchases: 0,
    });

    return this.resellerRepository.save(reseller);
  }

  /**
   * Find all resellers with filtering
   */
  async findAll(query: ResellerQueryDto): Promise<{ data: Reseller[]; total: number }> {
    const queryBuilder = this.resellerRepository.createQueryBuilder('reseller');

    if (query.search) {
      queryBuilder.andWhere(
        '(reseller.company ILIKE :search OR reseller.contactPerson ILIKE :search OR reseller.email ILIKE :search OR reseller.phone ILIKE :search OR reseller.resellerCode ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.branchId) queryBuilder.andWhere('reseller.branchId = :branchId', { branchId: query.branchId });
    if (query.status) queryBuilder.andWhere('reseller.status = :status', { status: query.status });
    if (query.type) queryBuilder.andWhere('reseller.type = :type', { type: query.type });
    if (query.priceLevel) queryBuilder.andWhere('reseller.priceLevel = :priceLevel', { priceLevel: query.priceLevel });
    if (query.hasBalance) queryBuilder.andWhere('reseller.currentBalance > 0');

    queryBuilder
      .leftJoinAndSelect('reseller.branch', 'branch')
      .orderBy('reseller.createdAt', 'DESC')
      .skip(query.skip || 0)
      .take(query.take || 20);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  /**
   * Find reseller by ID
   */
  async findOne(id: string): Promise<Reseller> {
    const reseller = await this.resellerRepository.findOne({
      where: { id },
      relations: ['branch'],
    });

    if (!reseller) {
      throw new NotFoundException(`Reseller with ID ${id} not found`);
    }

    return reseller;
  }

  /**
   * Find reseller by code
   */
  async findByCode(resellerCode: string): Promise<Reseller> {
    const reseller = await this.resellerRepository.findOne({
      where: { resellerCode },
      relations: ['branch'],
    });

    if (!reseller) {
      throw new NotFoundException(`Reseller with code ${resellerCode} not found`);
    }

    return reseller;
  }

  /**
   * Lookup reseller by code, phone, or email (for POS)
   */
  async lookup(lookupDto: ResellerLookupDto): Promise<Reseller | null> {
    if (!lookupDto.resellerCode && !lookupDto.phone && !lookupDto.email) {
      throw new BadRequestException('At least one lookup field is required');
    }

    const where: FindOptionsWhere<Reseller>[] = [];

    if (lookupDto.resellerCode) where.push({ resellerCode: lookupDto.resellerCode });
    if (lookupDto.phone) where.push({ phone: lookupDto.phone });
    if (lookupDto.email) where.push({ email: lookupDto.email });

    const reseller = await this.resellerRepository.findOne({
      where,
      relations: ['branch'],
    });

    return reseller;
  }

  /**
   * Update reseller
   */
  async update(id: string, updateResellerDto: UpdateResellerDto): Promise<Reseller> {
    const reseller = await this.findOne(id);

    // Check for duplicate email/phone
    if (updateResellerDto.email && updateResellerDto.email !== reseller.email) {
      const existingEmail = await this.resellerRepository.findOne({
        where: { email: updateResellerDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Reseller with this email already exists');
      }
    }

    if (updateResellerDto.phone && updateResellerDto.phone !== reseller.phone) {
      const existingPhone = await this.resellerRepository.findOne({
        where: { phone: updateResellerDto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('Reseller with this phone already exists');
      }
    }

    Object.assign(reseller, updateResellerDto);
    return this.resellerRepository.save(reseller);
  }

  /**
   * Check if reseller can make a credit purchase
   */
  async canMakeCreditPurchase(id: string, amount: number): Promise<{ 
    allowed: boolean; 
    availableCredit: number; 
    reason?: string 
  }> {
    const reseller = await this.findOne(id);

    if (reseller.status !== ResellerStatus.ACTIVE) {
      return { 
        allowed: false, 
        availableCredit: 0, 
        reason: `Reseller account is ${reseller.status}` 
      };
    }

    const availableCredit = Number(reseller.creditLimit) - Number(reseller.currentBalance);
    
    if (amount > availableCredit) {
      return { 
        allowed: false, 
        availableCredit, 
        reason: `Insufficient credit. Available: ₱${availableCredit.toFixed(2)}` 
      };
    }

    return { allowed: true, availableCredit };
  }

  /**
   * Add purchase to reseller balance (credit sale)
   */
  async addPurchase(id: string, amount: number): Promise<Reseller> {
    const reseller = await this.findOne(id);

    // Check credit limit
    const availableCredit = Number(reseller.creditLimit) - Number(reseller.currentBalance);
    if (amount > availableCredit) {
      throw new BadRequestException(`Insufficient credit. Available: ₱${availableCredit.toFixed(2)}`);
    }

    reseller.currentBalance = Number(reseller.currentBalance) + amount;
    reseller.totalPurchases = Number(reseller.totalPurchases) + amount;

    return this.resellerRepository.save(reseller);
  }

  /**
   * Adjust balance (for corrections)
   */
  async adjustBalance(id: string, adjustDto: AdjustCreditDto): Promise<Reseller> {
    const reseller = await this.findOne(id);

    const newBalance = Number(reseller.currentBalance) + adjustDto.amount;
    if (newBalance < 0) {
      throw new BadRequestException('Balance cannot be negative');
    }

    reseller.currentBalance = newBalance;
    return this.resellerRepository.save(reseller);
  }

  /**
   * Record payment (reduce balance)
   */
  async recordPayment(id: string, paymentDto: RecordPaymentDto): Promise<Reseller> {
    const reseller = await this.findOne(id);

    if (paymentDto.amount > Number(reseller.currentBalance)) {
      throw new BadRequestException(`Payment exceeds current balance of ₱${reseller.currentBalance}`);
    }

    reseller.currentBalance = Number(reseller.currentBalance) - paymentDto.amount;
    return this.resellerRepository.save(reseller);
  }

  /**
   * Update credit limit
   */
  async updateCreditLimit(id: string, creditLimit: number): Promise<Reseller> {
    const reseller = await this.findOne(id);
    reseller.creditLimit = creditLimit;
    return this.resellerRepository.save(reseller);
  }

  /**
   * Update price level
   */
  async updatePriceLevel(id: string, priceLevel: PriceLevel): Promise<Reseller> {
    const reseller = await this.findOne(id);
    reseller.priceLevel = priceLevel;
    return this.resellerRepository.save(reseller);
  }

  /**
   * Activate reseller
   */
  async activate(id: string): Promise<Reseller> {
    const reseller = await this.findOne(id);
    reseller.status = ResellerStatus.ACTIVE;
    return this.resellerRepository.save(reseller);
  }

  /**
   * Deactivate reseller
   */
  async deactivate(id: string): Promise<Reseller> {
    const reseller = await this.findOne(id);
    reseller.status = ResellerStatus.INACTIVE;
    return this.resellerRepository.save(reseller);
  }

  /**
   * Suspend reseller
   */
  async suspend(id: string): Promise<Reseller> {
    const reseller = await this.findOne(id);
    reseller.status = ResellerStatus.SUSPENDED;
    return this.resellerRepository.save(reseller);
  }

  /**
   * Soft delete reseller
   */
  async remove(id: string): Promise<void> {
    const reseller = await this.findOne(id);
    
    if (Number(reseller.currentBalance) > 0) {
      throw new BadRequestException('Cannot delete reseller with outstanding balance');
    }
    
    await this.resellerRepository.softRemove(reseller);
  }

  /**
   * Get resellers with outstanding balance
   */
  async getWithOutstandingBalance(branchId?: string): Promise<Reseller[]> {
    const where: FindOptionsWhere<Reseller> = {
      currentBalance: MoreThan(0),
    };

    if (branchId) where.branchId = branchId;

    return this.resellerRepository.find({
      where,
      relations: ['branch'],
      order: { currentBalance: 'DESC' },
    });
  }

  /**
   * Get reseller statistics
   */
  async getStatistics(branchId?: string): Promise<{
    totalResellers: number;
    activeResellers: number;
    totalOutstandingBalance: number;
    totalCreditLimit: number;
    priceLevelDistribution: Record<string, number>;
  }> {
    const queryBuilder = this.resellerRepository.createQueryBuilder('reseller');

    if (branchId) {
      queryBuilder.where('reseller.branchId = :branchId', { branchId });
    }

    const totalResellers = await queryBuilder.getCount();

    const activeResellers = await queryBuilder
      .clone()
      .andWhere('reseller.status = :status', { status: ResellerStatus.ACTIVE })
      .getCount();

    const balanceResult = await queryBuilder
      .clone()
      .select('SUM(reseller.currentBalance)', 'totalBalance')
      .addSelect('SUM(reseller.creditLimit)', 'totalLimit')
      .getRawOne();

    const priceLevelDistribution = await queryBuilder
      .clone()
      .select('reseller.priceLevel', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('reseller.priceLevel')
      .getRawMany();

    return {
      totalResellers,
      activeResellers,
      totalOutstandingBalance: Number(balanceResult?.totalBalance) || 0,
      totalCreditLimit: Number(balanceResult?.totalLimit) || 0,
      priceLevelDistribution: priceLevelDistribution.reduce((acc, item) => {
        acc[item.level || 'NONE'] = parseInt(item.count);
        return acc;
      }, {}),
    };
  }

  /**
   * Get top resellers by total purchases
   */
  async getTopResellers(limit: number = 3, branchId?: string): Promise<Reseller[]> {
    const queryBuilder = this.resellerRepository.createQueryBuilder('reseller');

    queryBuilder.where('reseller.status = :status', { status: ResellerStatus.ACTIVE });

    if (branchId) {
      queryBuilder.andWhere('reseller.branchId = :branchId', { branchId });
    }

    return queryBuilder
      .leftJoinAndSelect('reseller.branch', 'branch')
      .orderBy('reseller.totalPurchases', 'DESC')
      .take(limit)
      .getMany();
  }
}
