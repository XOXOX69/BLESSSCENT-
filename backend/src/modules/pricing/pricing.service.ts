import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { PriceProfile } from './entities/price-profile.entity';
import { PromoPrice } from './entities/promo-price.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CreatePriceProfileDto, UpdatePriceProfileDto, CreatePromoPriceDto, UpdatePromoPriceDto, PriceLookupDto } from './dto/pricing.dto';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(PriceProfile)
    private readonly priceProfileRepository: Repository<PriceProfile>,
    @InjectRepository(PromoPrice)
    private readonly promoPriceRepository: Repository<PromoPrice>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
  ) {}

  // Price Profile Methods
  async findAllPriceProfiles(variantId?: string) {
    const queryBuilder = this.priceProfileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.variant', 'variant')
      .where('profile.deletedAt IS NULL');

    if (variantId) {
      queryBuilder.andWhere('profile.variantId = :variantId', { variantId });
    }

    return queryBuilder.orderBy('profile.createdAt', 'DESC').getMany();
  }

  async findOnePriceProfile(id: string): Promise<PriceProfile> {
    const profile = await this.priceProfileRepository.findOne({
      where: { id },
      relations: ['variant', 'promoPrices'],
    });

    if (!profile) {
      throw new NotFoundException('Price profile not found');
    }

    return profile;
  }

  async findByVariantId(variantId: string): Promise<PriceProfile> {
    let profile = await this.priceProfileRepository.findOne({
      where: { variantId },
      relations: ['promoPrices'],
    });

    if (!profile) {
      throw new NotFoundException('Price profile not found for this variant');
    }

    return profile;
  }

  async getOrCreate(variantId: string): Promise<PriceProfile> {
    let profile = await this.priceProfileRepository.findOne({
      where: { variantId },
    });

    if (!profile) {
      profile = this.priceProfileRepository.create({
        variantId,
        retailPrice: 0,
        memberPrice: 0,
        memberDiscountPercent: 0,
        resellerPrice: 0,
        resellerDiscountPercent: 0,
        wholesalePrice: 0,
        costPrice: 0,
        taxPercent: 0,
      });
      profile = await this.priceProfileRepository.save(profile);
    }

    return profile;
  }

  async createPriceProfile(dto: CreatePriceProfileDto): Promise<PriceProfile> {
    const existing = await this.priceProfileRepository.findOne({
      where: { variantId: dto.variantId },
    });

    if (existing) {
      throw new BadRequestException('Price profile already exists for this variant');
    }

    const profile = this.priceProfileRepository.create(dto);
    return this.priceProfileRepository.save(profile);
  }

  async updatePriceProfile(id: string, dto: UpdatePriceProfileDto): Promise<PriceProfile> {
    const profile = await this.findOnePriceProfile(id);
    Object.assign(profile, dto);
    return this.priceProfileRepository.save(profile);
  }

  async deletePriceProfile(id: string): Promise<void> {
    const profile = await this.findOnePriceProfile(id);
    await this.priceProfileRepository.softDelete(profile.id);
  }

  // Promo Price Methods
  async findAllPromoPrices(priceProfileId?: string, activeOnly = false) {
    const queryBuilder = this.promoPriceRepository
      .createQueryBuilder('promo')
      .leftJoinAndSelect('promo.priceProfile', 'priceProfile')
      .where('promo.deletedAt IS NULL');

    if (priceProfileId) {
      queryBuilder.andWhere('promo.priceProfileId = :priceProfileId', { priceProfileId });
    }

    if (activeOnly) {
      const now = new Date();
      queryBuilder.andWhere('promo.isActive = true');
      queryBuilder.andWhere('promo.startDate <= :now', { now });
      queryBuilder.andWhere('promo.endDate >= :now', { now });
    }

    return queryBuilder.orderBy('promo.startDate', 'DESC').getMany();
  }

  async findOnePromoPrice(id: string): Promise<PromoPrice> {
    const promo = await this.promoPriceRepository.findOne({
      where: { id },
      relations: ['priceProfile'],
    });

    if (!promo) {
      throw new NotFoundException('Promo price not found');
    }

    return promo;
  }

  async createPromoPrice(dto: CreatePromoPriceDto): Promise<PromoPrice> {
    const promo = this.promoPriceRepository.create(dto);
    return this.promoPriceRepository.save(promo);
  }

  async updatePromoPrice(id: string, dto: UpdatePromoPriceDto): Promise<PromoPrice> {
    const promo = await this.findOnePromoPrice(id);
    Object.assign(promo, dto);
    return this.promoPriceRepository.save(promo);
  }

  async deletePromoPrice(id: string): Promise<void> {
    const promo = await this.findOnePromoPrice(id);
    await this.promoPriceRepository.softDelete(promo.id);
  }

  // Price Lookup Methods (Critical for POS)
  async getPriceForSale(dto: PriceLookupDto) {
    const { variantId, memberId, resellerId, promoCode } = dto;

    const profile = await this.findByVariantId(variantId);

    let finalPrice = Number(profile.retailPrice);
    let priceType = 'retail';
    let discountPercent = 0;
    let promoApplied: PromoPrice | null = null;

    // Check for valid promo code
    if (promoCode) {
      const promo = await this.promoPriceRepository.findOne({
        where: {
          promoCode,
          isActive: true,
        },
      });

      if (promo && promo.isValid && !promo.isMemberOnly) {
        finalPrice = Number(promo.price);
        priceType = 'promo';
        promoApplied = promo;
      }
    }

    // Apply member price if member
    if (memberId && !promoApplied) {
      const effectiveMemberPrice = profile.effectiveMemberPrice;
      if (effectiveMemberPrice < finalPrice) {
        finalPrice = effectiveMemberPrice;
        priceType = 'member';
        discountPercent = Number(profile.memberDiscountPercent);
      }
    }

    // Apply reseller price if reseller
    if (resellerId && !promoApplied) {
      const effectiveResellerPrice = profile.effectiveResellerPrice;
      if (effectiveResellerPrice < finalPrice) {
        finalPrice = effectiveResellerPrice;
        priceType = 'reseller';
        discountPercent = Number(profile.resellerDiscountPercent);
      }
    }

    return {
      variantId,
      retailPrice: Number(profile.retailPrice),
      finalPrice,
      priceType,
      discountPercent,
      taxPercent: Number(profile.taxPercent),
      memberPrice: profile.effectiveMemberPrice,
      resellerPrice: profile.effectiveResellerPrice,
      promoApplied,
    };
  }

  async getPricesForMultipleVariants(
    variantIds: string[],
    isMember = false,
    isReseller = false,
  ) {
    const prices: Record<string, any> = {};

    for (const variantId of variantIds) {
      try {
        const profile = await this.findByVariantId(variantId);
        let finalPrice = Number(profile.retailPrice);
        let priceType = 'retail';

        if (isMember) {
          const memberPrice = profile.effectiveMemberPrice;
          if (memberPrice < finalPrice) {
            finalPrice = memberPrice;
            priceType = 'member';
          }
        }

        if (isReseller) {
          const resellerPrice = profile.effectiveResellerPrice;
          if (resellerPrice < finalPrice) {
            finalPrice = resellerPrice;
            priceType = 'reseller';
          }
        }

        prices[variantId] = {
          variantId,
          retailPrice: Number(profile.retailPrice),
          finalPrice,
          priceType,
          taxPercent: Number(profile.taxPercent),
        };
      } catch {
        prices[variantId] = null;
      }
    }

    return prices;
  }

  // Bulk Operations
  async bulkUpdatePrices(updates: Array<{ variantId: string; retailPrice?: number; memberPrice?: number; resellerPrice?: number }>) {
    const results = [];

    for (const update of updates) {
      const profile = await this.getOrCreate(update.variantId);

      if (update.retailPrice !== undefined) {
        profile.retailPrice = update.retailPrice;
      }
      if (update.memberPrice !== undefined) {
        profile.memberPrice = update.memberPrice;
      }
      if (update.resellerPrice !== undefined) {
        profile.resellerPrice = update.resellerPrice;
      }

      results.push(await this.priceProfileRepository.save(profile));
    }

    return results;
  }

  // Active Promo Check
  async getActivePromos(variantId?: string) {
    const profile = variantId ? await this.findByVariantId(variantId) : null;

    const queryBuilder = this.promoPriceRepository
      .createQueryBuilder('promo')
      .where('promo.isActive = true')
      .andWhere('promo.startDate <= :now', { now: new Date() })
      .andWhere('promo.endDate >= :now', { now: new Date() });

    if (profile) {
      queryBuilder.andWhere('promo.priceProfileId = :priceProfileId', {
        priceProfileId: profile.id,
      });
    }

    return queryBuilder.orderBy('promo.endDate', 'ASC').getMany();
  }

  // Get variant with price (for POS sales)
  async getVariantWithPrice(variantId: string, branchId: string, priceType: 'retail' | 'member' | 'reseller') {
    const variant = await this.variantRepository.findOne({
      where: { id: variantId, deletedAt: IsNull() },
      relations: ['product', 'product.category'],
    });

    if (!variant) {
      return null;
    }

    const profile = await this.getOrCreate(variantId);
    let currentPrice = Number(profile.retailPrice);

    if (priceType === 'member') {
      currentPrice = Number(profile.effectiveMemberPrice);
    } else if (priceType === 'reseller') {
      currentPrice = Number(profile.effectiveResellerPrice);
    }

    return {
      ...variant,
      currentPrice,
      retailPrice: Number(profile.retailPrice),
      memberPrice: Number(profile.effectiveMemberPrice),
      resellerPrice: Number(profile.effectiveResellerPrice),
      taxPercent: Number(profile.taxPercent),
      priceProfile: profile,
    };
  }
}
