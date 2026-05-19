import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { WebsocketModule } from '../../websocket/websocket.module'

@Module({
  imports: [
    BullModule.registerQueue({ name: 'sync' }, { name: 'notifications' }),
    WebsocketModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
