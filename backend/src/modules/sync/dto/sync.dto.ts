import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsDateString,
  IsUUID,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SyncAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum SyncEntityType {
  SALE = 'SALE',
  PAYMENT = 'PAYMENT',
  MEMBER = 'MEMBER',
  INVENTORY_ADJUSTMENT = 'INVENTORY_ADJUSTMENT',
}

export enum SyncStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  CONFLICT = 'CONFLICT',
  FAILED = 'FAILED',
}

export class SyncItemDto {
  @ApiProperty({ description: 'Offline ID from POS device' })
  @IsString()
  offlineId: string;

  @ApiProperty({ enum: SyncEntityType })
  @IsEnum(SyncEntityType)
  entityType: SyncEntityType;

  @ApiProperty({ enum: SyncAction })
  @IsEnum(SyncAction)
  action: SyncAction;

  @ApiProperty({ description: 'Entity data as JSON' })
  data: any;

  @ApiProperty({ description: 'Timestamp when created offline' })
  @IsDateString()
  offlineTimestamp: string;

  @ApiPropertyOptional({ description: 'Device ID' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class SyncPushDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Device identifier' })
  @IsString()
  deviceId: string;

  @ApiProperty({ type: [SyncItemDto], description: 'Items to sync' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncItemDto)
  items: SyncItemDto[];

  @ApiPropertyOptional({ description: 'Last sync timestamp for this device' })
  @IsOptional()
  @IsDateString()
  lastSyncAt?: string;
}

export class SyncPullDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ description: 'Device identifier' })
  @IsString()
  deviceId: string;

  @ApiPropertyOptional({ description: 'Last sync timestamp' })
  @IsOptional()
  @IsDateString()
  lastSyncAt?: string;

  @ApiPropertyOptional({ description: 'Entity types to pull', type: [String] })
  @IsOptional()
  @IsArray()
  entities?: string[];
}

export class SyncResultItemDto {
  @ApiProperty({ description: 'Offline ID' })
  offlineId: string;

  @ApiProperty({ enum: SyncStatus })
  status: SyncStatus;

  @ApiPropertyOptional({ description: 'Server-assigned ID' })
  serverId?: string;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;

  @ApiPropertyOptional({ description: 'Conflict data if conflict' })
  conflictData?: any;
}

export class SyncPushResultDto {
  @ApiProperty({ description: 'Overall sync success' })
  success: boolean;

  @ApiProperty({ description: 'Sync timestamp' })
  syncTimestamp: string;

  @ApiProperty({ type: [SyncResultItemDto] })
  results: SyncResultItemDto[];

  @ApiProperty({ description: 'Number of successful syncs' })
  successCount: number;

  @ApiProperty({ description: 'Number of failed syncs' })
  failedCount: number;

  @ApiProperty({ description: 'Number of conflicts' })
  conflictCount: number;
}

export class SyncPullResultDto {
  @ApiProperty({ description: 'Sync timestamp' })
  syncTimestamp: string;

  @ApiProperty({ description: 'Products data' })
  products: any[];

  @ApiProperty({ description: 'Product variants data' })
  variants: any[];

  @ApiProperty({ description: 'Price profiles data' })
  priceProfiles: any[];

  @ApiProperty({ description: 'Active promos data' })
  promos: any[];

  @ApiProperty({ description: 'Members data' })
  members: any[];

  @ApiProperty({ description: 'Resellers data' })
  resellers: any[];

  @ApiProperty({ description: 'Inventory data for branch' })
  inventory: any[];

  @ApiProperty({ description: 'Deletions since last sync' })
  deletions: {
    entityType: string;
    ids: string[];
  }[];
}
