import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket,
} from '@nestjs/websockets'
import { UseGuards, Logger } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { WsJwtGuard } from '../common/guards/ws-jwt.guard'

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/pos',
  transports: ['websocket'],
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server
  private readonly logger = new Logger(OrdersGateway.name)
  private connectedDevices = new Map<string, { deviceId: string; branchId: string; socketId: string }>()

  handleConnection(client: Socket) {
    this.logger.log(`POS conectado: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    this.connectedDevices.delete(client.id)
    this.logger.log(`POS desconectado: ${client.id}`)
  }

  @SubscribeMessage('register-device')
  handleRegister(
    @MessageBody() data: { deviceId: string; branchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.connectedDevices.set(client.id, { ...data, socketId: client.id })
    client.join(`branch:${data.branchId}`)
    client.emit('registered', { success: true, deviceId: data.deviceId })
    this.logger.log(`Dispositivo ${data.deviceId} registrado en sucursal ${data.branchId}`)
  }

  @SubscribeMessage('order-ack')
  handleOrderAck(@MessageBody() data: { orderId: string; deviceId: string }) {
    this.logger.log(`Pedido ${data.orderId} confirmado por ${data.deviceId}`)
  }

  // Emitir nuevo pedido web a todos los POS de la sucursal
  emitNewOrder(order: any) {
    const room = `branch:${order.branchId ?? 'main'}`
    this.server.to(room).emit('new-order', {
      type: 'NEW_ORDER',
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        items: order.items?.length,
        customerName: order.customerName ?? order.customer?.firstName,
        createdAt: order.createdAt,
      },
    })
    this.logger.log(`Pedido ${order.orderNumber} emitido a ${room}`)
  }

  emitOrderStatusChange(orderId: string, status: string) {
    this.server.emit('order-status-changed', {
      type: 'ORDER_STATUS_CHANGED',
      payload: { orderId, status },
    })
  }

  emitStockUpdate(productId: string, newStock: number, branchId = 'main') {
    this.server.to(`branch:${branchId}`).emit('stock-updated', {
      type: 'STOCK_UPDATED',
      payload: { productId, newStock },
    })
  }

  emitSyncCompleted(session: any) {
    this.server.emit('sync-completed', { type: 'SYNC_COMPLETED', payload: session })
  }

  getConnectedDevicesCount(): number {
    return this.connectedDevices.size
  }
}
