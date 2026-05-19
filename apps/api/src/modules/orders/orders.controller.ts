import {
  Controller, Get, Post, Put, Patch, Body, Param, Query,
  UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { OrdersService } from './orders.service'
import { CreateOrderDto, UpdateOrderStatusDto } from './orders.dto'

@ApiTags('Pedidos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear pedido (web o POS)' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOrderDto, @Request() req: any) {
    return this.ordersService.create(dto, req.user)
  }

  @Get()
  @Roles('admin', 'superadmin', 'cashier')
  @ApiOperation({ summary: 'Listar pedidos con filtros' })
  findAll(
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('branchId') branchId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ordersService.findAll({ status, source, branchId, page, limit, from, to })
  }

  @Get('pending-web')
  @Roles('admin', 'superadmin', 'cashier')
  @ApiOperation({ summary: 'Pedidos web pendientes (para POS)' })
  getPendingWeb(@Query('branchId') branchId?: string) {
    return this.ordersService.getPendingWebOrders(branchId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id)
  }

  @Patch(':id/status')
  @Roles('admin', 'superadmin', 'cashier', 'butcher')
  @ApiOperation({ summary: 'Actualizar estado del pedido' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req: any,
  ) {
    return this.ordersService.updateStatus(id, dto, req.user)
  }

  @Post(':id/print')
  @Roles('admin', 'superadmin', 'cashier')
  @ApiOperation({ summary: 'Marcar pedido como impreso' })
  markPrinted(@Param('id') id: string) {
    return this.ordersService.markPrinted(id)
  }

  @Post('pos/session/open')
  @Roles('admin', 'superadmin', 'cashier')
  openSession(@Body() body: { openingCash: number; registerNumber: number }, @Request() req: any) {
    return this.ordersService.openSession(body, req.user)
  }

  @Post('pos/session/:sessionId/close')
  @Roles('admin', 'superadmin', 'cashier')
  closeSession(
    @Param('sessionId') sessionId: string,
    @Body() body: { closingCash: number; notes?: string },
    @Request() req: any,
  ) {
    return this.ordersService.closeSession(sessionId, body, req.user)
  }
}
