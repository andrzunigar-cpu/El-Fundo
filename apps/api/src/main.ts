import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  )

  const config = app.get(ConfigService)
  const port = config.get<number>('API_PORT', 3001)

  app.enableCors({
    origin: [
      config.get('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000'),
      /^http:\/\/192\.168\.\d+\.\d+/,  // red local
    ],
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  app.setGlobalPrefix('api/v1')

  // Swagger solo en desarrollo
  if (config.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Carnicería El Fundo API')
      .setDescription('API REST + WebSocket para sistema POS/Ecommerce')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup('api/docs', app, document)
    logger.log(`Swagger: http://localhost:${port}/api/docs`)
  }

  await app.listen(port, '0.0.0.0')
  logger.log(`API corriendo en: http://localhost:${port}`)
  logger.log(`WebSocket: ws://localhost:${port}`)
}

bootstrap()
