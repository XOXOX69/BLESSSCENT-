import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsUUID,
  IsDateString,
  Min,
} from 'class-validator';
import { LedgerEntryType, LedgerEntryStatus } from '../entities/ledger-entry.entity';

export class CreateCreditSaleEntryDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ description: 'Reseller ID' })
  @IsUUID()
  resellerId: string;

  @ApiProperty({ description: 'Sale amount (debit)' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Sale ID reference' })
  @IsUUID()
  saleId: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Due date for payment' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'User ID who created this entry' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

export class CreatePaymentEntryDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ description: 'Reseller ID' })
  @IsUUID()
  resellerId: string;

  @ApiProperty({ description: 'Payment amount (credit)' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Payment method' })
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ description: 'Payment reference (check number, transfer ref, etc.)' })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'User ID who created this entry' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateAdjustmentEntryDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ description: 'Reseller ID' })
  @IsUUID()
  resellerId: string;

  @ApiProperty({ enum: ['DEBIT', 'CREDIT'], description: 'Adjustment type' })
  @IsEnum(['DEBIT', 'CREDIT'])
  adjustmentType: 'DEBIT' | 'CREDIT';

  @ApiProperty({ description: 'Adjustment amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Reason for adjustment' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'User ID who created this entry' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class LedgerQueryDto {
  @ApiPropertyOptional({ description: 'Reseller ID' })
  @IsOptional()
  @IsUUID()
  resellerId?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: LedgerEntryType })
  @IsOptional()
  @IsEnum(LedgerEntryType)
  entryType?: LedgerEntryType;

  @ApiPropertyOptional({ enum: LedgerEntryStatus })
  @IsOptional()
  @IsEnum(LedgerEntryStatus)
  status?: LedgerEntryStatus;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Skip records for pagination' })
  @IsOptional()
  @IsNumber()
  skip?: number;

  @ApiPropertyOptional({ description: 'Take records for pagination' })
  @IsOptional()
  @IsNumber()
  take?: number;
}

export class ResellerStatementDto {
  @ApiProperty({ description: 'Reseller ID' })
  @IsUUID()
  resellerId: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
