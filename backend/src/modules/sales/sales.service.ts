import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, Not } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Payment } from './entities/payment.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { InventoryService } from '../inventory/inventory.service';
import { PricingService } from '../pricing/pricing.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private dataSource: DataSource,
    private inventoryService: InventoryService,
    private pricingService: PricingService,
  ) {}

  async create(createSaleDto: CreateSaleDto, userId: string): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate receipt number
      const receiptNumber = await this.generateReceiptNumber(createSaleDto.branchId);

      // Determine customer type pricing
      const customerType = createSaleDto.customerType || 'RETAIL';
      const priceType = customerType === 'MEMBER' ? 'member' : 
                        customerType === 'RESELLER' ? 'reseller' : 'retail';

      // Create sale
      const sale = this.saleRepository.create({
        branchId: createSaleDto.branchId,
        userId: userId,
        customerId: createSaleDto.customerId,
        customerType: customerType,
        receiptNumber: receiptNumber,
        source: createSaleDto.source || 'POS',
        offlineId: createSaleDto.offlineId,
        notes: createSaleDto.notes,
        saleStatus: 'COMPLETED',
        paymentStatus: 'COMPLETED',
      });

      // Process items
      let subtotal = 0;
      let discountAmount = 0;
      const saleItems: SaleItem[] = [];

      for (const itemDto of createSaleDto.items) {
        // Get variant with price
        const variant = await this.pricingService.getVariantWithPrice(
          itemDto.variantId, 
          createSaleDto.branchId, 
          priceType as 'retail' | 'member' | 'reseller'
        );

        if (!variant) {
          throw new NotFoundException(`Variant ${itemDto.variantId} not found`);
        }

        // Check stock
        const stock = await this.inventoryService.getStock(
          itemDto.variantId, 
          createSaleDto.branchId
        );

        if (!stock || (stock.quantityOnHand - stock.quantityReserved) < itemDto.quantity) {
          throw new BadRequestException(`Insufficient stock for ${variant.name}`);
        }

        const unitPrice = itemDto.unitPrice || variant.currentPrice;
        const discount = itemDto.discount || 0;
        const taxPercent = variant.taxPercent || 0;
        const itemTotal = (unitPrice - discount) * itemDto.quantity;
        const taxAmount = itemTotal * (taxPercent / 100);

        subtotal += unitPrice * itemDto.quantity;
        discountAmount += discount * itemDto.quantity;

        const saleItem = this.saleItemRepository.create({
          variantId: itemDto.variantId,
          name: variant.product?.name || variant.name,
          variantName: variant.name,
          quantity: itemDto.quantity,
          unitPrice: unitPrice,
          originalPrice: variant.retailPrice || variant.currentPrice,
          discount: discount,
          taxPercent: taxPercent,
          taxAmount: taxAmount,
          total: itemTotal + taxAmount,
        });

        saleItems.push(saleItem);

        // Reserve stock
        await this.inventoryService.reserveStock(
          itemDto.variantId,
          createSaleDto.branchId,
          itemDto.quantity,
          queryRunner.manager
        );
      }

      const totalAmount = subtotal - discountAmount;
      const amountPaid = createSaleDto.amountPaid || totalAmount;
      const changeDue = amountPaid - totalAmount;

      sale.subtotal = subtotal;
      sale.discountAmount = discountAmount;
      sale.taxAmount = saleItems.reduce((sum, item) => sum + Number(item.taxAmount), 0);
      sale.totalAmount = totalAmount + sale.taxAmount;
      sale.amountPaid = amountPaid;
      sale.changeDue = changeDue > 0 ? changeDue : 0;

      // Save sale with items
      await queryRunner.manager.save(sale);
      sale.items = saleItems;
      await queryRunner.manager.save(saleItems);

      // Deduct stock
      for (const itemDto of createSaleDto.items) {
        await this.inventoryService.deductStock(
          itemDto.variantId,
          createSaleDto.branchId,
          itemDto.quantity,
          sale.id,
          queryRunner.manager
        );
      }

      // Process payments
      if (createSaleDto.payments && createSaleDto.payments.length > 0) {
        const payments = createSaleDto.payments.map(paymentDto => 
          this.paymentRepository.create({
            saleId: sale.id,
            amount: paymentDto.amount,
            paymentMethod: paymentDto.paymentMethod,
            referenceNumber: paymentDto.referenceNumber,
            notes: paymentDto.notes,
            paymentStatus: 'COMPLETED',
          })
        );
        await queryRunner.manager.save(payments);
        sale.payments = payments;
      }

      await queryRunner.commitTransaction();
      return sale;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(branchId?: string, limit = 50, offset = 0): Promise<Sale[]> {
    const query = this.saleRepository.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.branch', 'branch')
      .leftJoinAndSelect('sale.user', 'user')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('sale.payments', 'payments')
      .where('sale.deletedAt IS NULL')
      .orderBy('sale.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (branchId) {
      query.andWhere('sale.branchId = :branchId', { branchId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: ['branch', 'user', 'items', 'payments', 'member', 'reseller'],
    });

    if (!sale) {
      throw new NotFoundException(`Sale ${id} not found`);
    }

    return sale;
  }

  async findByReceipt(receiptNumber: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { receiptNumber },
      relations: ['branch', 'user', 'items', 'payments'],
    });

    if (!sale) {
      throw new NotFoundException(`Receipt ${receiptNumber} not found`);
    }

    return sale;
  }

  async findByOfflineId(offlineId: string): Promise<Sale | null> {
    return this.saleRepository.findOne({
      where: { offlineId },
    });
  }

  async updateSyncStatus(id: string, syncStatus: string): Promise<void> {
    await this.saleRepository.update(id, { syncStatus });
  }

  async getDailySales(branchId: string, date: Date): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await this.saleRepository
      .createQueryBuilder('sale')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(sale.totalAmount), 0)', 'total')
      .where('sale.branchId = :branchId', { branchId })
      .andWhere('sale.createdAt >= :startOfDay', { startOfDay })
      .andWhere('sale.createdAt <= :endOfDay', { endOfDay })
      .andWhere('sale.deletedAt IS NULL')
      .getRawOne();

    return {
      date: date.toISOString().split('T')[0],
      transactionCount: parseInt(sales.count) || 0,
      totalSales: parseFloat(sales.total) || 0,
    };
  }

  private async generateReceiptNumber(branchId: string): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `RCPT-${dateStr}-`;
    
    const lastSale = await this.saleRepository
      .createQueryBuilder('sale')
      .where('sale.receiptNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('sale.receiptNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastSale) {
      const lastSequence = parseInt(lastSale.receiptNumber.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(5, '0')}`;
  }
}
