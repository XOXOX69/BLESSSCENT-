import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, ILike } from 'typeorm';
import { Member } from './entities/member.entity';
import {
  CreateMemberDto,
  UpdateMemberDto,
  AdjustPointsDto,
  RedeemPointsDto,
  MemberQueryDto,
  MemberLookupDto,
  MemberStatus,
  MemberTier,
} from './dto/member.dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) {}

  /**
   * Generate unique member code
   */
  private async generateMemberCode(branchId: string): Promise<string> {
    const prefix = 'MBR';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Get count of members this month
    const count = await this.memberRepository.count({
      where: {
        memberCode: Like(`${prefix}${year}${month}%`),
      },
    });
    
    const sequence = (count + 1).toString().padStart(4, '0');
    return `${prefix}${year}${month}${sequence}`;
  }

  /**
   * Calculate member tier based on total purchases
   */
  private calculateTier(totalPurchases: number): MemberTier {
    if (totalPurchases >= 100000) return MemberTier.PLATINUM;
    if (totalPurchases >= 50000) return MemberTier.GOLD;
    if (totalPurchases >= 20000) return MemberTier.SILVER;
    return MemberTier.BRONZE;
  }

  /**
   * Calculate points earned from purchase amount
   * 1 point per 100 pesos spent
   */
  calculatePointsFromPurchase(amount: number): number {
    return Math.floor(amount / 100);
  }

  /**
   * Create a new member
   */
  async create(createMemberDto: CreateMemberDto): Promise<Member> {
    // Check for existing member with same email or phone
    if (createMemberDto.email) {
      const existingEmail = await this.memberRepository.findOne({
        where: { email: createMemberDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Member with this email already exists');
      }
    }

    if (createMemberDto.phone) {
      const existingPhone = await this.memberRepository.findOne({
        where: { phone: createMemberDto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('Member with this phone already exists');
      }
    }

    const memberCode = await this.generateMemberCode(createMemberDto.branchId);

    const member = this.memberRepository.create({
      ...createMemberDto,
      memberCode,
      status: MemberStatus.ACTIVE,
      points: 0,
      totalPurchases: 0,
      memberTier: MemberTier.BRONZE,
    });

    return this.memberRepository.save(member);
  }

  /**
   * Find all members with filtering
   */
  async findAll(query: MemberQueryDto): Promise<{ data: Member[]; total: number }> {
    const where: FindOptionsWhere<Member> = {};

    if (query.branchId) where.branchId = query.branchId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.memberTier) where.memberTier = query.memberTier;

    const queryBuilder = this.memberRepository.createQueryBuilder('member');

    if (query.search) {
      queryBuilder.andWhere(
        '(member.firstName ILIKE :search OR member.lastName ILIKE :search OR member.email ILIKE :search OR member.phone ILIKE :search OR member.memberCode ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.branchId) queryBuilder.andWhere('member.branchId = :branchId', { branchId: query.branchId });
    if (query.status) queryBuilder.andWhere('member.status = :status', { status: query.status });
    if (query.type) queryBuilder.andWhere('member.type = :type', { type: query.type });
    if (query.memberTier) queryBuilder.andWhere('member.memberTier = :memberTier', { memberTier: query.memberTier });

    queryBuilder
      .leftJoinAndSelect('member.branch', 'branch')
      .orderBy('member.createdAt', 'DESC')
      .skip(query.skip || 0)
      .take(query.take || 20);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  /**
   * Find member by ID
   */
  async findOne(id: string): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { id },
      relations: ['branch'],
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    return member;
  }

  /**
   * Find member by code
   */
  async findByCode(memberCode: string): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { memberCode },
      relations: ['branch'],
    });

    if (!member) {
      throw new NotFoundException(`Member with code ${memberCode} not found`);
    }

    return member;
  }

  /**
   * Lookup member by code, phone, or email (for POS)
   */
  async lookup(lookupDto: MemberLookupDto): Promise<Member | null> {
    if (!lookupDto.memberCode && !lookupDto.phone && !lookupDto.email) {
      throw new BadRequestException('At least one lookup field is required');
    }

    const where: FindOptionsWhere<Member>[] = [];

    if (lookupDto.memberCode) where.push({ memberCode: lookupDto.memberCode });
    if (lookupDto.phone) where.push({ phone: lookupDto.phone });
    if (lookupDto.email) where.push({ email: lookupDto.email });

    const member = await this.memberRepository.findOne({
      where,
      relations: ['branch'],
    });

    return member;
  }

  /**
   * Update member
   */
  async update(id: string, updateMemberDto: UpdateMemberDto): Promise<Member> {
    const member = await this.findOne(id);

    // Check for duplicate email/phone
    if (updateMemberDto.email && updateMemberDto.email !== member.email) {
      const existingEmail = await this.memberRepository.findOne({
        where: { email: updateMemberDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Member with this email already exists');
      }
    }

    if (updateMemberDto.phone && updateMemberDto.phone !== member.phone) {
      const existingPhone = await this.memberRepository.findOne({
        where: { phone: updateMemberDto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('Member with this phone already exists');
      }
    }

    Object.assign(member, updateMemberDto);
    return this.memberRepository.save(member);
  }

  /**
   * Adjust points (add or subtract)
   */
  async adjustPoints(id: string, adjustDto: AdjustPointsDto): Promise<Member> {
    const member = await this.findOne(id);

    const newPoints = member.points + adjustDto.points;
    if (newPoints < 0) {
      throw new BadRequestException('Insufficient points');
    }

    member.points = newPoints;
    return this.memberRepository.save(member);
  }

  /**
   * Redeem points
   */
  async redeemPoints(id: string, redeemDto: RedeemPointsDto): Promise<Member> {
    const member = await this.findOne(id);

    if (member.points < redeemDto.points) {
      throw new BadRequestException(`Insufficient points. Available: ${member.points}`);
    }

    member.points -= redeemDto.points;
    return this.memberRepository.save(member);
  }

  /**
   * Add purchase amount and update tier
   */
  async addPurchase(id: string, amount: number): Promise<Member> {
    const member = await this.findOne(id);

    // Add points based on purchase
    const earnedPoints = this.calculatePointsFromPurchase(amount);
    member.points += earnedPoints;

    // Update total purchases
    member.totalPurchases = Number(member.totalPurchases) + amount;

    // Update tier based on new total
    member.memberTier = this.calculateTier(member.totalPurchases);

    return this.memberRepository.save(member);
  }

  /**
   * Activate member
   */
  async activate(id: string): Promise<Member> {
    const member = await this.findOne(id);
    member.status = MemberStatus.ACTIVE;
    return this.memberRepository.save(member);
  }

  /**
   * Deactivate member
   */
  async deactivate(id: string): Promise<Member> {
    const member = await this.findOne(id);
    member.status = MemberStatus.INACTIVE;
    return this.memberRepository.save(member);
  }

  /**
   * Suspend member
   */
  async suspend(id: string): Promise<Member> {
    const member = await this.findOne(id);
    member.status = MemberStatus.SUSPENDED;
    return this.memberRepository.save(member);
  }

  /**
   * Soft delete member
   */
  async remove(id: string): Promise<void> {
    const member = await this.findOne(id);
    await this.memberRepository.softRemove(member);
  }

  /**
   * Get member statistics
   */
  async getStatistics(branchId?: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    totalPoints: number;
    tierDistribution: Record<string, number>;
  }> {
    const queryBuilder = this.memberRepository.createQueryBuilder('member');

    if (branchId) {
      queryBuilder.where('member.branchId = :branchId', { branchId });
    }

    const totalMembers = await queryBuilder.getCount();

    const activeMembers = await queryBuilder
      .clone()
      .andWhere('member.status = :status', { status: MemberStatus.ACTIVE })
      .getCount();

    const totalPointsResult = await queryBuilder
      .clone()
      .select('SUM(member.points)', 'total')
      .getRawOne();

    const tierDistribution = await queryBuilder
      .clone()
      .select('member.memberTier', 'tier')
      .addSelect('COUNT(*)', 'count')
      .groupBy('member.memberTier')
      .getRawMany();

    return {
      totalMembers,
      activeMembers,
      totalPoints: totalPointsResult?.total || 0,
      tierDistribution: tierDistribution.reduce((acc, item) => {
        acc[item.tier || 'NONE'] = parseInt(item.count);
        return acc;
      }, {}),
    };
  }
}
