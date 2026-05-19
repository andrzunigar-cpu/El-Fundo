import { Controller, Post, Get, Body, Query, Headers, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { SyncService } from './sync.service'
import type { SyncQueueItem } from '../../types'

@ApiTags('Sincronización')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  @ApiOperation({ summary: 'POS sube cambios locales al cloud' })
  push(
    @Body() body: { items: SyncQueueItem[] },
    @Headers('x-device-id') deviceId: string,
  ) {
    return this.syncService.processBatch(body.items, deviceId)
  }

  @Get('pull')
  @ApiOperation({ summary: 'POS descarga cambios cloud desde lastSyncAt' })
  pull(
    @Query('lastSyncAt') lastSyncAt: string,
    @Query('branchId') branchId: string,
    @Headers('x-device-id') deviceId: string,
  ) {
    return this.syncService.getCloudChanges(deviceId, lastSyncAt, branchId)
  }
}
