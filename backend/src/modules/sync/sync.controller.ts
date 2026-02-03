import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { SyncPushDto, SyncPullDto, SyncPushResultDto, SyncPullResultDto } from './dto/sync.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.INVENTORY)
  @ApiOperation({ 
    summary: 'Push offline data to server',
    description: 'Syncs offline transactions, member updates, and inventory adjustments to the server'
  })
  async pushSync(
    @Body() dto: SyncPushDto,
    @Request() req: any,
  ): Promise<SyncPushResultDto> {
    // Add user ID from JWT
    dto.userId = req.user.id;
    return this.syncService.pushSync(dto);
  }

  @Post('pull')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.INVENTORY)
  @ApiOperation({
    summary: 'Pull master data from server',
    description: 'Fetches products, pricing, members, resellers, and inventory for offline use'
  })
  async pullSync(@Body() dto: SyncPullDto): Promise<SyncPullResultDto> {
    return this.syncService.pullSync(dto);
  }

  @Get('logs')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get sync logs' })
  @ApiQuery({ name: 'branchId', required: true })
  @ApiQuery({ name: 'deviceId', required: false })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async getSyncLogs(
    @Query('branchId') branchId: string,
    @Query('deviceId') deviceId?: string,
    @Query('take') take?: number,
  ) {
    return this.syncService.getSyncLogs(branchId, deviceId, take);
  }

  @Get('status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get sync status for a device' })
  @ApiQuery({ name: 'branchId', required: true })
  @ApiQuery({ name: 'deviceId', required: true })
  async getSyncStatus(
    @Query('branchId') branchId: string,
    @Query('deviceId') deviceId: string,
  ) {
    const logs = await this.syncService.getSyncLogs(branchId, deviceId, 1);
    const lastSync = logs[0];

    return {
      lastSyncAt: lastSync?.completedAt || null,
      lastSyncStatus: lastSync?.status || null,
      deviceId,
      branchId,
    };
  }
}
