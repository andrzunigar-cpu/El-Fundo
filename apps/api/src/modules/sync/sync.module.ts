import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { SyncController } from './sync.controller'
import { SyncService } from './sync.service'
import { WebsocketModule } from '../../websocket/websocket.module'

@Module({
  imports: [
    BullModule.registerQueue({ name: 'sync' }),
    WebsocketModule,
  ],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
