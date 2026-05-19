import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwt: JwtService, private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient()
    const token = client.handshake?.auth?.token ?? client.handshake?.headers?.authorization?.split(' ')[1]
    if (!token) return false
    try {
      client.data.user = this.jwt.verify(token, { secret: this.config.get('JWT_SECRET') })
      return true
    } catch {
      return false
    }
  }
}
