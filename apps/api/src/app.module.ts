import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { BullModule } from '@nestjs/bullmq'
import { AuthModule } from './modules/auth/auth.module'
import { ProductsModule } from './modules/products/products.module'
import { OrdersModule } from './modules/orders/orders.module'
import { CustomersModule } from './modules/customers/customers.module'
import { InventoryModule } from './modules/inventory/inventory.module'
import { SyncModule } from './modules/sync/sync.module'
import { ReportsModule } from './modules/reports/reports.module'
import { WebsocketModule } from './websocket/websocket.module'
import { DatabaseModule } from './database/database.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),

    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD'),
        },
      }),
    }),

    DatabaseModule,
    WebsocketModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    CustomersModule,
    InventoryModule,
    SyncModule,
    ReportsModule,
  ],
})
export class AppModule {}
