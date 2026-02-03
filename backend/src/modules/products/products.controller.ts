import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateVariantDto,
  UpdateVariantDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  ProductFilterDto,
  AddBundleItemDto,
} from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Product Endpoints
  @Get()
  async findAllProducts(@Query() filter: ProductFilterDto) {
    return this.productsService.findAllProducts(filter);
  }

  @Get('brands')
  async getBrands() {
    return this.productsService.getBrands();
  }

  @Get(':id')
  async findOneProduct(@Param('id') id: string) {
    return this.productsService.findOneProduct(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.updateProduct(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async deactivateProduct(@Param('id') id: string) {
    return this.productsService.deactivateProduct(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async activateProduct(@Param('id') id: string) {
    return this.productsService.activateProduct(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteProduct(@Param('id') id: string) {
    await this.productsService.deleteProduct(id);
    return { message: 'Product deleted successfully' };
  }

  // Variant Endpoints
  @Get(':productId/variants')
  async findAllVariants(@Param('productId') productId: string) {
    return this.productsService.findAllVariants(productId);
  }

  @Get(':productId/variants/:variantId')
  async findOneVariant(@Param('variantId') variantId: string) {
    return this.productsService.findOneVariant(variantId);
  }

  @Post(':productId/variants')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async createVariant(
    @Param('productId') productId: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.productsService.createVariant({ ...dto, productId });
  }

  @Put(':productId/variants/:variantId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async updateVariant(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.productsService.updateVariant(variantId, dto);
  }

  @Patch(':productId/variants/:variantId/deactivate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async deactivateVariant(@Param('variantId') variantId: string) {
    return this.productsService.deactivateVariant(variantId);
  }

  // Category Endpoints
  @Get('categories/all')
  async findAllCategories() {
    return this.productsService.findAllCategories();
  }

  @Get('categories/:id')
  async findOneCategory(@Param('id') id: string) {
    return this.productsService.findOneCategory(id);
  }

  @Post('categories')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.productsService.createCategory(dto);
  }

  @Put('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.productsService.updateCategory(id, dto);
  }

  @Patch('categories/:id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async deactivateCategory(@Param('id') id: string) {
    return this.productsService.deactivateCategory(id);
  }

  // Bundle Endpoints
  @Get(':productId/bundle-items')
  async getBundleItems(@Param('productId') productId: string) {
    return this.productsService.getBundleItems(productId);
  }

  @Post(':productId/bundle-items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async addBundleItem(
    @Param('productId') productId: string,
    @Body() dto: AddBundleItemDto,
  ) {
    return this.productsService.addBundleItem(productId, dto.variantId, dto.quantity);
  }

  @Delete(':productId/bundle-items/:variantId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY)
  async removeBundleItem(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ) {
    await this.productsService.removeBundleItem(productId, variantId);
    return { message: 'Bundle item removed successfully' };
  }
}
