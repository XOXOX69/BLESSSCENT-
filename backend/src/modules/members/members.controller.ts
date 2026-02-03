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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MembersService } from './members.service';
import {
  CreateMemberDto,
  UpdateMemberDto,
  AdjustPointsDto,
  RedeemPointsDto,
  MemberQueryDto,
  MemberLookupDto,
  MemberStatus,
  MemberType,
  MemberTier,
} from './dto/member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@ApiTags('members')
@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Create a new member' })
  @ApiResponse({ status: 201, description: 'Member created successfully' })
  async create(@Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(createMemberDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get all members with filtering' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'status', enum: MemberStatus, required: false })
  @ApiQuery({ name: 'type', enum: MemberType, required: false })
  @ApiQuery({ name: 'memberTier', enum: MemberTier, required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  async findAll(
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
    @Query('status') status?: MemberStatus,
    @Query('type') type?: MemberType,
    @Query('memberTier') memberTier?: MemberTier,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.membersService.findAll({
      search,
      branchId,
      status,
      type,
      memberTier,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get member statistics' })
  @ApiQuery({ name: 'branchId', required: false })
  async getStatistics(@Query('branchId') branchId?: string) {
    return this.membersService.getStatistics(branchId);
  }

  @Post('lookup')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Lookup member by code, phone, or email (for POS)' })
  async lookup(@Body() lookupDto: MemberLookupDto) {
    return this.membersService.lookup(lookupDto);
  }

  @Get('code/:memberCode')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get member by code' })
  async findByCode(@Param('memberCode') memberCode: string) {
    return this.membersService.findByCode(memberCode);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get member by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.membersService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update member' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    return this.membersService.update(id, updateMemberDto);
  }

  @Post(':id/points/adjust')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Adjust member points (add or subtract)' })
  async adjustPoints(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() adjustDto: AdjustPointsDto,
  ) {
    return this.membersService.adjustPoints(id, adjustDto);
  }

  @Post(':id/points/redeem')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Redeem member points' })
  async redeemPoints(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() redeemDto: RedeemPointsDto,
  ) {
    return this.membersService.redeemPoints(id, redeemDto);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Activate member' })
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.membersService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Deactivate member' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.membersService.deactivate(id);
  }

  @Patch(':id/suspend')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Suspend member' })
  async suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.membersService.suspend(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete member (soft delete)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.membersService.remove(id);
  }
}
