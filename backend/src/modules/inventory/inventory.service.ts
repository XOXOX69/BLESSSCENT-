import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { CreateInventoryDto, UpdateInventoryDto, AdjustInventoryDto, InventoryFilterDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
  ) {}

  async findAll(filter: InventoryFilterDto) {
    const { branchId, variantId, search, lowStock, page = 1, limit = 50 } = filter;

    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.variant', 'variant')
      .leftJoinAndSelect('inventory.branch', 'branch')
      .where('inventory.deletedAt IS NULL');

    if (branchId) {
      queryBuilder.andWhere('inventory.branchId = :branchId', { branchId });
    }

    if (variantId) {
      queryBuilder.andWhere('inventory.variantId = :variantId', { variantId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(variant.name ILIKE :search OR variant.sku ILIKE :search OR branch.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (lowStock) {
      queryBuilder.andWhere('inventory.quantityOnHand <= inventory.reorderLevel');
    }

    const total = await queryBuilder.getCount();
    const items = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('inventory.updatedAt', 'DESC')
      .getMany();

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['variant', 'branch'],
    });

    if (!inventory) {
      throw new NotFoundException('Inventory record not found');
    }

    return inventory;
  }

  async findByVariantAndBranch(variantId: string, branchId: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { variantId, branchId },
      relations: ['variant', 'branch'],
    });

    if (!inventory) {
      throw new NotFoundException('Inventory record not found for this variant and branch');
    }

    return inventory;
  }

  async getOrCreate(variantId: string, branchId: string): Promise<Inventory> {
    let inventory = await this.inventoryRepository.findOne({
      where: { variantId, branchId },
    });

    if (!inventory) {
      inventory = this.inventoryRepository.create({
        variantId,
        branchId,
        quantityOnHand: 0,
        quantityReserved: 0,
      });
      inventory = await this.inventoryRepository.save(inventory);
    }

    return inventory;
  }

  async create(dto: CreateInventoryDto): Promise<Inventory> {
    const existing = await this.inventoryRepository.findOne({
      where: { variantId: dto.variantId, branchId: dto.branchId },
    });

    if (existing) {
      throw new BadRequestException('Inventory record already exists for this variant and branch');
    }

    const inventory = this.inventoryRepository.create(dto);
    return this.inventoryRepository.save(inventory);
  }

  async update(id: string, dto: UpdateInventoryDto): Promise<Inventory> {
    const inventory = await this.findOne(id);
    Object.assign(inventory, dto);
    return this.inventoryRepository.save(inventory);
  }

  async adjust(id: string, dto: AdjustInventoryDto): Promise<Inventory> {
    const inventory = await this.findOne(id);

    const newQuantity = inventory.quantityOnHand + dto.adjustment;
    if (newQuantity < 0) {
      throw new BadRequestException('Adjustment would result in negative inventory');
    }

    inventory.quantityOnHand = newQuantity;

    if (dto.adjustment > 0) {
      inventory.lastRestockedAt = new Date();
    }

    return this.inventoryRepository.save(inventory);
  }

  async reserve(id: string, quantity: number): Promise<Inventory> {
    const inventory = await this.findOne(id);
    const available = inventory.quantityOnHand - inventory.quantityReserved;

    if (quantity > available) {
      throw new BadRequestException(`Insufficient stock. Available: ${available}`);
    }

    inventory.quantityReserved += quantity;
    return this.inventoryRepository.save(inventory);
  }

  async release(id: string, quantity: number): Promise<Inventory> {
    const inventory = await this.findOne(id);

    if (quantity > inventory.quantityReserved) {
      throw new BadRequestException('Cannot release more than reserved quantity');
    }

    inventory.quantityReserved -= quantity;
    return this.inventoryRepository.save(inventory);
  }

  async deduct(id: string, quantity: number): Promise<Inventory> {
    const inventory = await this.findOne(id);
    const available = inventory.quantityOnHand - inventory.quantityReserved;

    if (quantity > available) {
      throw new BadRequestException(`Insufficient stock. Available: ${available}`);
    }

    inventory.quantityOnHand -= quantity;
    inventory.quantityReserved -= quantity;

    if (inventory.quantityReserved < 0) {
      inventory.quantityReserved = 0;
    }

    return this.inventoryRepository.save(inventory);
  }

  async delete(id: string): Promise<void> {
    const inventory = await this.findOne(id);
    await this.inventoryRepository.softDelete(inventory.id);
  }

  async getStock(variantId: string, branchId: string): Promise<Inventory | null> {
    return this.inventoryRepository.findOne({
      where: { variantId, branchId },
    });
  }

  async reserveStock(variantId: string, branchId: string, quantity: number, manager?: any): Promise<Inventory> {
    if (manager) {
      const inventory = await manager.findOne(Inventory, { where: { variantId, branchId } });
      inventory.quantityReserved += quantity;
      return manager.save(inventory);
    }
    return this.reserve(await this.getOrCreate(variantId, branchId).then(i => i.id), quantity);
  }

  async deductStock(variantId: string, branchId: string, quantity: number, referenceId?: string, manager?: any): Promise<Inventory> {
    if (manager) {
      const inventory = await manager.findOne(Inventory, { where: { variantId, branchId } });
      inventory.quantityOnHand -= quantity;
      inventory.quantityReserved -= quantity;
      if (inventory.quantityReserved < 0) inventory.quantityReserved = 0;
      return manager.save(inventory);
    }
    return this.deduct(await this.getOrCreate(variantId, branchId).then(i => i.id), quantity);
  }

  async checkAvailability(variantId: string, branchId: string, quantity: number): Promise<boolean> {
    try {
      const inventory = await this.findByVariantAndBranch(variantId, branchId);
      return (inventory.quantityOnHand - inventory.quantityReserved) >= quantity;
    } catch {
      return false;
    }
  }

  async getAvailableQuantity(variantId: string, branchId: string): Promise<number> {
    try {
      const inventory = await this.findByVariantAndBranch(variantId, branchId);
      return inventory.quantityOnHand - inventory.quantityReserved;
    } catch {
      return 0;
    }
  }

  async getLowStockItems(branchId?: string): Promise<Inventory[]> {
    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.variant', 'variant')
      .leftJoinAndSelect('inventory.branch', 'branch')
      .where('inventory.deletedAt IS NULL')
      .andWhere('inventory.quantityOnHand <= inventory.reorderLevel');

    if (branchId) {
      queryBuilder.andWhere('inventory.branchId = :branchId', { branchId });
    }

    return queryBuilder.orderBy('inventory.quantityOnHand', 'ASC').getMany();
  }

  async adjustStock(id: string, dto: { adjustment: number; reason?: string }): Promise<Inventory> {
    return this.adjust(id, dto);
  }
}
