import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductCategory } from './entities/product-category.entity';
import { ProductBundleItem } from './entities/product-bundle-item.entity';
import { CreateProductDto, UpdateProductDto, CreateVariantDto, UpdateVariantDto, CreateCategoryDto, ProductFilterDto, UpdateCategoryDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductCategory)
    private readonly categoryRepository: Repository<ProductCategory>,
    @InjectRepository(ProductBundleItem)
    private readonly bundleItemRepository: Repository<ProductBundleItem>,
  ) {}

  // Product Methods
  async findAllProducts(filter: ProductFilterDto) {
    const { search, brand, categoryId, isActive, isBundle, page = 1, limit = 50 } = filter;

    const queryBuilder = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.deletedAt IS NULL');

    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR product.brand ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (brand) {
      queryBuilder.andWhere('product.brand = :brand', { brand });
    }

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive });
    }

    if (isBundle !== undefined) {
      queryBuilder.andWhere('product.isBundle = :isBundle', { isBundle });
    }

    const total = await queryBuilder.getCount();
    const products = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('product.createdAt', 'DESC')
      .getMany();

    return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneProduct(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'variants', 'bundleItems', 'bundleItems.variant'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const sku = dto.sku || `PFM-${Date.now()}`;

    const existingProduct = await this.productRepository.findOne({
      where: { sku },
    });

    if (existingProduct) {
      throw new ConflictException('Product with this SKU already exists');
    }

    const product = this.productRepository.create({
      ...dto,
      sku,
    });

    return this.productRepository.save(product);
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOneProduct(id);

    if (dto.sku && dto.sku !== product.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: { sku: dto.sku },
      });
      if (existingProduct) {
        throw new ConflictException('Product with this SKU already exists');
      }
    }

    Object.assign(product, dto);
    return this.productRepository.save(product);
  }

  async deactivateProduct(id: string): Promise<Product> {
    const product = await this.findOneProduct(id);
    product.isActive = false;
    return this.productRepository.save(product);
  }

  async activateProduct(id: string): Promise<Product> {
    const product = await this.findOneProduct(id);
    product.isActive = true;
    return this.productRepository.save(product);
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.findOneProduct(id);
    await this.productRepository.softDelete(product.id);
  }

  // Variant Methods
  async findAllVariants(productId: string) {
    return this.variantRepository.find({
      where: { productId, isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOneVariant(id: string): Promise<ProductVariant> {
    const variant = await this.variantRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    return variant;
  }

  async createVariant(dto: CreateVariantDto): Promise<ProductVariant> {
    const sku = dto.sku || `PFM-${dto.productId}-${Date.now()}`;

    const existingVariant = await this.variantRepository.findOne({
      where: { sku },
    });

    if (existingVariant) {
      throw new ConflictException('Variant with this SKU already exists');
    }

    const variant = this.variantRepository.create({
      ...dto,
      sku,
    });

    return this.variantRepository.save(variant);
  }

  async updateVariant(id: string, dto: UpdateVariantDto): Promise<ProductVariant> {
    const variant = await this.findOneVariant(id);
    Object.assign(variant, dto);
    return this.variantRepository.save(variant);
  }

  async deactivateVariant(id: string): Promise<ProductVariant> {
    const variant = await this.findOneVariant(id);
    variant.isActive = false;
    return this.variantRepository.save(variant);
  }

  // Category Methods
  async findAllCategories() {
    return this.categoryRepository
      .createQueryBuilder('category')
      .where('category.deletedAt IS NULL')
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.name', 'ASC')
      .getMany();
  }

  async findOneCategory(id: string): Promise<ProductCategory> {
    const category = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('category.children', 'children')
      .where('category.id = :id', { id })
      .andWhere('category.deletedAt IS NULL')
      .getOne();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async createCategory(dto: CreateCategoryDto): Promise<ProductCategory> {
    const existingCategory = await this.categoryRepository.findOne({
      where: { code: dto.code },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this code already exists');
    }

    const category = this.categoryRepository.create(dto);
    return this.categoryRepository.save(category);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<ProductCategory> {
    const category = await this.findOneCategory(id);

    if (dto.code && dto.code !== category.code) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { code: dto.code },
      });
      if (existingCategory) {
        throw new ConflictException('Category with this code already exists');
      }
    }

    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async deactivateCategory(id: string): Promise<ProductCategory> {
    const category = await this.findOneCategory(id);
    category.isActive = false;
    return this.categoryRepository.save(category);
  }

  // Bundle Methods
  async getBundleItems(bundleProductId: string) {
    return this.bundleItemRepository.find({
      where: { bundleProductId },
      relations: ['variant', 'variant.product'],
    });
  }

  async addBundleItem(bundleProductId: string, variantId: string, quantity: number = 1) {
    const existingItem = await this.bundleItemRepository.findOne({
      where: { bundleProductId, variantId },
    });

    if (existingItem) {
      existingItem.quantity = quantity;
      return this.bundleItemRepository.save(existingItem);
    }

    const bundleItem = this.bundleItemRepository.create({
      bundleProductId,
      variantId,
      quantity,
    });

    return this.bundleItemRepository.save(bundleItem);
  }

  async removeBundleItem(bundleProductId: string, variantId: string) {
    const item = await this.bundleItemRepository.findOne({
      where: { bundleProductId, variantId },
    });

    if (item) {
      await this.bundleItemRepository.softDelete(item.id);
    }
  }

  // Helper Methods
  async getBrands(): Promise<string[]> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('DISTINCT product.brand', 'brand')
      .where('product.brand IS NOT NULL')
      .getRawMany();

    return result.map((r) => r.brand);
  }
}
