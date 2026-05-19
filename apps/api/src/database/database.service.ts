import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name)

  async onModuleInit() {
    await this.$connect()
    this.logger.log('Base de datos conectada')
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
