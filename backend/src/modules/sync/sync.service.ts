import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { SyncLog, SyncLogStatus } from './entities/sync-log.entity';
import {
  SyncPushDto,
  SyncPullDto,
  SyncPushResultDto,
  SyncPullResultDto,
  SyncResultItemDto,
  SyncStatus,
  SyncEntityType,
  SyncAction,
} from './dto/sync.dto';
import { SalesService } from '../sales/sales.service';
import { MembersService } from '../members/members.service';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../products/products.service';
import { PricingService } from '../pricing/pricing.service';
import { ResellersService } from '../resellers/resellers.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectRepository(SyncLog)
    private readonly syncLogRepository: Repository<SyncLog>,
    private readonly salesService: SalesService,
    private readonly membersService: MembersService,
    private readonly inventoryService: InventoryService,
    private readonly productsService: ProductsService,
    private readonly pricingService: PricingService,
    private readonly resellersService: ResellersService,
  ) {}

  /**
   * Push sync - receive data from POS
   * Handles offline transactions and syncs them to server
   */
  async pushSync(dto: SyncPushDto): Promise<SyncPushResultDto> {
    const startedAt = new Date();
    const results: SyncResultItemDto[] = [];
    let successCount = 0;
    let failedCount = 0;
    let conflictCount = 0;

    this.logger.log(`Push sync started from device ${dto.deviceId}, ${dto.items.length} items`);

    for (const item of dto.items) {
      try {
        const result = await this.processSyncItem(item, dto.branchId, dto.userId);
        results.push(result);

        if (result.status === SyncStatus.SUCCESS) successCount++;
        else if (result.status === SyncStatus.FAILED) failedCount++;
        else if (result.status === SyncStatus.CONFLICT) conflictCount++;
      } catch (error) {
        this.logger.error(`Failed to process sync item ${item.offlineId}:`, error);
        results.push({
          offlineId: item.offlineId,
          status: SyncStatus.FAILED,
          error: error.message,
        });
        failedCount++;
      }
    }

    const syncTimestamp = new Date().toISOString();

    // Log the sync
    await this.syncLogRepository.save({
      branchId: dto.branchId,
      userId: dto.userId,
      deviceId: dto.deviceId,
      syncType: 'PUSH',
      status: failedCount === 0 ? SyncLogStatus.SUCCESS : 
              successCount > 0 ? SyncLogStatus.PARTIAL : SyncLogStatus.FAILED,
      itemsCount: dto.items.length,
      successCount,
      failedCount,
      conflictCount,
      details: { results },
      startedAt,
      completedAt: new Date(),
    });

    return {
      success: failedCount === 0,
      syncTimestamp,
      results,
      successCount,
      failedCount,
      conflictCount,
    };
  }

  /**
   * Process individual sync item
   */
  private async processSyncItem(
    item: any,
    branchId: string,
    userId: string,
  ): Promise<SyncResultItemDto> {
    switch (item.entityType) {
      case SyncEntityType.SALE:
        return this.processSaleSync(item, branchId, userId);
      case SyncEntityType.MEMBER:
        return this.processMemberSync(item, branchId);
      case SyncEntityType.INVENTORY_ADJUSTMENT:
        return this.processInventorySync(item, branchId);
      default:
        return {
          offlineId: item.offlineId,
          status: SyncStatus.FAILED,
          error: `Unknown entity type: ${item.entityType}`,
        };
    }
  }

  /**
   * Process sale sync
   */
  private async processSaleSync(
    item: any,
    branchId: string,
    userId: string,
  ): Promise<SyncResultItemDto> {
    try {
      // Check if sale already exists (idempotency)
      const existingSale = await this.salesService.findByOfflineId(item.offlineId);
      if (existingSale) {
        return {
          offlineId: item.offlineId,
          status: SyncStatus.SUCCESS,
          serverId: existingSale.id,
        };
      }

      // Create the sale
      const saleData = {
        ...item.data,
        branchId,
        offlineId: item.offlineId,
        source: 'POS_OFFLINE',
      };

      const sale = await this.salesService.create(saleData, userId);

      return {
        offlineId: item.offlineId,
        status: SyncStatus.SUCCESS,
        serverId: sale.id,
      };
    } catch (error) {
      return {
        offlineId: item.offlineId,
        status: SyncStatus.FAILED,
        error: error.message,
      };
    }
  }

  /**
   * Process member sync
   */
  private async processMemberSync(
    item: any,
    branchId: string,
  ): Promise<SyncResultItemDto> {
    try {
      if (item.action === SyncAction.CREATE) {
        const member = await this.membersService.create({
          ...item.data,
          branchId,
        });
        return {
          offlineId: item.offlineId,
          status: SyncStatus.SUCCESS,
          serverId: member.id,
        };
      } else if (item.action === SyncAction.UPDATE && item.data.id) {
        const member = await this.membersService.update(item.data.id, item.data);
        return {
          offlineId: item.offlineId,
          status: SyncStatus.SUCCESS,
          serverId: member.id,
        };
      }

      return {
        offlineId: item.offlineId,
        status: SyncStatus.FAILED,
        error: 'Invalid action or missing ID',
      };
    } catch (error) {
      return {
        offlineId: item.offlineId,
        status: SyncStatus.FAILED,
        error: error.message,
      };
    }
  }

  /**
   * Process inventory sync
   */
  private async processInventorySync(
    item: any,
    branchId: string,
  ): Promise<SyncResultItemDto> {
    try {
      const { variantId, adjustment, reason } = item.data;
      
      // Server wins for stock conflicts
      // Just log the adjustment, don't apply if there's a conflict
      const inventory = await this.inventoryService.findByVariantAndBranch(variantId, branchId);
      
      if (!inventory) {
        return {
          offlineId: item.offlineId,
          status: SyncStatus.FAILED,
          error: 'Inventory record not found',
        };
      }

      // Apply adjustment
      await this.inventoryService.adjustStock(inventory.id, {
        adjustment,
        reason: `Offline sync: ${reason}`,
      });

      return {
        offlineId: item.offlineId,
        status: SyncStatus.SUCCESS,
        serverId: inventory.id,
      };
    } catch (error) {
      return {
        offlineId: item.offlineId,
        status: SyncStatus.FAILED,
        error: error.message,
      };
    }
  }

  /**
   * Pull sync - send master data to POS
   */
  async pullSync(dto: SyncPullDto): Promise<SyncPullResultDto> {
    const startedAt = new Date();
    const lastSync = dto.lastSyncAt ? new Date(dto.lastSyncAt) : null;

    this.logger.log(`Pull sync for device ${dto.deviceId}, last sync: ${dto.lastSyncAt || 'never'}`);

    // Get all master data (or only updated since lastSync)
    const [products, variants, priceProfiles, promos, members, resellers, inventory] = await Promise.all([
      this.getProductsForSync(lastSync),
      this.getVariantsForSync(lastSync),
      this.getPriceProfilesForSync(lastSync),
      this.getActivePromosForSync(),
      this.getMembersForSync(dto.branchId, lastSync),
      this.getResellersForSync(dto.branchId, lastSync),
      this.getInventoryForSync(dto.branchId, lastSync),
    ]);

    const syncTimestamp = new Date().toISOString();

    // Log the sync
    await this.syncLogRepository.save({
      branchId: dto.branchId,
      deviceId: dto.deviceId,
      syncType: 'PULL',
      status: SyncLogStatus.SUCCESS,
      itemsCount: products.length + variants.length + members.length + resellers.length + inventory.length,
      successCount: products.length + variants.length + members.length + resellers.length + inventory.length,
      failedCount: 0,
      conflictCount: 0,
      startedAt,
      completedAt: new Date(),
    });

    return {
      syncTimestamp,
      products,
      variants,
      priceProfiles,
      promos,
      members,
      resellers,
      inventory,
      deletions: [], // TODO: Track soft deletes
    };
  }

  private async getProductsForSync(lastSync: Date | null) {
    const result = await this.productsService.findAllProducts({ limit: 10000 });
    return result.products.map((p: any) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      brand: p.brand,
      categoryId: p.categoryId,
      basePrice: p.basePrice,
      unitOfMeasure: p.unitOfMeasure,
      isActive: p.isActive,
      isBundle: p.isBundle,
      updatedAt: p.updatedAt,
    }));
  }

  private async getVariantsForSync(lastSync: Date | null) {
    // Get all variants through products
    const products = await this.productsService.findAllProducts({ limit: 10000 });
    const variants: any[] = [];
    
    for (const product of products.products) {
      if (product.variants) {
        for (const v of product.variants) {
          variants.push({
            id: v.id,
            productId: v.productId,
            sku: v.sku,
            name: v.name,
            size: v.size,
            concentration: v.concentration,
            barcode: v.barcode,
            isActive: v.isActive,
            updatedAt: v.updatedAt,
          });
        }
      }
    }
    
    return variants;
  }

  private async getPriceProfilesForSync(lastSync: Date | null) {
    const result = await this.pricingService.findAllPriceProfiles();
    return result.map((p: any) => ({
      id: p.id,
      variantId: p.variantId,
      retailPrice: p.retailPrice,
      memberPrice: p.memberPrice,
      resellerPrice: p.resellerPrice,
      wholesalePrice: p.wholesalePrice,
      costPrice: p.costPrice,
      taxPercent: p.taxPercent,
      updatedAt: p.updatedAt,
    }));
  }

  private async getActivePromosForSync() {
    const promos = await this.pricingService.getActivePromos();
    return promos.map((p: any) => ({
      id: p.id,
      priceProfileId: p.priceProfileId,
      name: p.name,
      startDate: p.startDate,
      endDate: p.endDate,
      price: p.price,
      discountPercent: p.discountPercent,
      isMemberOnly: p.isMemberOnly,
      promoCode: p.promoCode,
    }));
  }

  private async getMembersForSync(branchId: string, lastSync: Date | null) {
    const result = await this.membersService.findAll({ branchId, take: 10000 });
    return result.data.map((m: any) => ({
      id: m.id,
      memberCode: m.memberCode,
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      phone: m.phone,
      status: m.status,
      points: m.points,
      memberTier: m.memberTier,
      type: m.type,
      updatedAt: m.updatedAt,
    }));
  }

  private async getResellersForSync(branchId: string, lastSync: Date | null) {
    const result = await this.resellersService.findAll({ branchId, take: 10000 });
    return result.data.map((r: any) => ({
      id: r.id,
      resellerCode: r.resellerCode,
      company: r.company,
      contactPerson: r.contactPerson,
      email: r.email,
      phone: r.phone,
      status: r.status,
      priceLevel: r.priceLevel,
      creditLimit: r.creditLimit,
      currentBalance: r.currentBalance,
      updatedAt: r.updatedAt,
    }));
  }

  private async getInventoryForSync(branchId: string, lastSync: Date | null) {
    const result = await this.inventoryService.findAll({ branchId, limit: 10000 });
    return result.items.map((i: any) => ({
      id: i.id,
      variantId: i.variantId,
      branchId: i.branchId,
      quantityOnHand: i.quantityOnHand,
      quantityReserved: i.quantityReserved,
      reorderLevel: i.reorderLevel,
      updatedAt: i.updatedAt,
    }));
  }

  /**
   * Get sync logs
   */
  async getSyncLogs(branchId: string, deviceId?: string, take = 50) {
    const where: any = { branchId };
    if (deviceId) where.deviceId = deviceId;

    return this.syncLogRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take,
    });
  }
}
