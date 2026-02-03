import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  IsNumber,
  IsEnum,
  IsUUID,
  Min,
} from 'class-validator';

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum MemberType {
  STANDARD = 'STANDARD',
  VIP = 'VIP',
  PREMIUM = 'PREMIUM',
}

export enum MemberTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export class CreateMemberDto {
  @ApiProperty({ description: 'Branch ID where member registered' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Date of birth' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: MemberType, default: MemberType.STANDARD })
  @IsOptional()
  @IsEnum(MemberType)
  type?: MemberType;

  @ApiPropertyOptional({ description: 'Notes about the member' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'User ID who registered the member' })
  @IsOptional()
  @IsString()
  registeredBy?: string;
}

export class UpdateMemberDto extends PartialType(CreateMemberDto) {
  @ApiPropertyOptional({ enum: MemberStatus })
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @ApiPropertyOptional({ enum: MemberTier })
  @IsOptional()
  @IsEnum(MemberTier)
  memberTier?: MemberTier;

  @ApiPropertyOptional({ description: 'Loyalty level' })
  @IsOptional()
  @IsString()
  loyaltyLevel?: string;
}

export class AdjustPointsDto {
  @ApiProperty({ description: 'Points to add (positive) or subtract (negative)' })
  @IsNumber()
  points: number;

  @ApiProperty({ description: 'Reason for adjustment' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Reference ID (e.g., sale ID)' })
  @IsOptional()
  @IsString()
  referenceId?: string;
}

export class RedeemPointsDto {
  @ApiProperty({ description: 'Points to redeem' })
  @IsNumber()
  @Min(1)
  points: number;

  @ApiPropertyOptional({ description: 'Sale ID for redemption' })
  @IsOptional()
  @IsUUID()
  saleId?: string;
}

export class MemberQueryDto {
  @ApiPropertyOptional({ description: 'Search by name, email, phone, or member code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: MemberStatus })
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @ApiPropertyOptional({ enum: MemberType })
  @IsOptional()
  @IsEnum(MemberType)
  type?: MemberType;

  @ApiPropertyOptional({ enum: MemberTier })
  @IsOptional()
  @IsEnum(MemberTier)
  memberTier?: MemberTier;

  @ApiPropertyOptional({ description: 'Skip records for pagination' })
  @IsOptional()
  @IsNumber()
  skip?: number;

  @ApiPropertyOptional({ description: 'Take records for pagination' })
  @IsOptional()
  @IsNumber()
  take?: number;
}

export class MemberLookupDto {
  @ApiPropertyOptional({ description: 'Member code' })
  @IsOptional()
  @IsString()
  memberCode?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
