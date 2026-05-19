import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class JwtAuthGuard {
  constructor(private jwt: JwtService, private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const auth = request.headers.authorization
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException()
    try {
      request.user = this.jwt.verify(auth.slice(7), { secret: this.config.get('JWT_SECRET') })
      return true
    } catch {
      throw new UnauthorizedException('Token inválido')
    }
  }
}
