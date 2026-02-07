import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  IsEnum,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export enum ResellerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export enum ResellerType {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  WHOLESALE = 'WHOLESALE',
  DISTRIBUTOR = 'DISTRIBUTOR',
}

export enum PriceLevel {
  LEVEL_1 = 'LEVEL_1', // Standard reseller
  LEVEL_2 = 'LEVEL_2', // Better discount
  LEVEL_3 = 'LEVEL_3', // Best discount
  WHOLESALE = 'WHOLESALE', // Wholesale pricing
}

export class CreateResellerDto {
  @ApiProperty({ description: 'Branch ID where reseller registered' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ description: 'Company name' })
  @IsString()
  company: string;

  @ApiPropertyOptional({ description: 'Contact person name' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ enum: PriceLevel, description: 'Price level for this reseller' })
  @IsEnum(PriceLevel)
  priceLevel: PriceLevel;

  @ApiPropertyOptional({ description: 'Credit limit in pesos', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({ description: 'Credit term in days', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  creditTermDays?: number;

  @ApiPropertyOptional({ enum: ResellerType, default: ResellerType.STANDARD })
  @IsOptional()
  @IsEnum(ResellerType)
  type?: ResellerType;

  @ApiPropertyOptional({ description: 'Tax ID / TIN' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Notes about the reseller' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Profile image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateResellerDto extends PartialType(CreateResellerDto) {
  @ApiPropertyOptional({ enum: ResellerStatus })
  @IsOptional()
  @IsEnum(ResellerStatus)
  status?: ResellerStatus;
}

export class AdjustCreditDto {
  @ApiProperty({ description: 'Amount to add (positive) or subtract (negative)' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Reason for adjustment' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Reference ID (e.g., payment ID)' })
  @IsOptional()
  @IsString()
  referenceId?: string;
}

export class RecordPaymentDto {
  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Payment method' })
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ description: 'Reference number (check number, transfer ref, etc.)' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Notes about the payment' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ResellerQueryDto {
  @ApiPropertyOptional({ description: 'Search by company, contact person, email, phone, or reseller code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: ResellerStatus })
  @IsOptional()
  @IsEnum(ResellerStatus)
  status?: ResellerStatus;

  @ApiPropertyOptional({ enum: ResellerType })
  @IsOptional()
  @IsEnum(ResellerType)
  type?: ResellerType;

  @ApiPropertyOptional({ enum: PriceLevel })
  @IsOptional()
  @IsEnum(PriceLevel)
  priceLevel?: PriceLevel;

  @ApiPropertyOptional({ description: 'Filter resellers with outstanding balance' })
  @IsOptional()
  hasBalance?: boolean;

  @ApiPropertyOptional({ description: 'Skip records for pagination' })
  @IsOptional()
  @IsNumber()
  skip?: number;

  @ApiPropertyOptional({ description: 'Take records for pagination' })
  @IsOptional()
  @IsNumber()
  take?: number;
}

export class ResellerLookupDto {
  @ApiPropertyOptional({ description: 'Reseller code' })
  @IsOptional()
  @IsString()
  resellerCode?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
