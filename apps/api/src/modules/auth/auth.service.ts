import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import { DatabaseService } from '../../database/database.service'
import type { LoginDto, RegisterDto, AuthTokens } from '../../types'

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.db.user.findUnique({ where: { email: dto.email } })
    if (!user || !user.isActive) throw new UnauthorizedException('Credenciales inválidas')
    const valid = await bcrypt.compare(dto.password, user.password)
    if (!valid) throw new UnauthorizedException('Credenciales inválidas')
    await this.db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    return this.generateTokens(user)
  }

  async register(dto: RegisterDto) {
    const existing = await this.db.user.findUnique({ where: { email: dto.email } })
    if (existing) throw new ConflictException('Email ya registrado')
    const hashedPassword = await bcrypt.hash(dto.password, 12)
    const user = await this.db.user.create({
      data: { ...dto, password: hashedPassword, role: dto.role ?? 'customer', isActive: true },
    })
    return this.generateTokens(user)
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwt.verify(refreshToken, { secret: this.config.get('JWT_SECRET') })
      const user = await this.db.user.findUnique({ where: { id: payload.sub } })
      if (!user || !user.isActive) throw new UnauthorizedException()
      return this.generateTokens(user)
    } catch {
      throw new UnauthorizedException('Token inválido o expirado')
    }
  }

  async validateUser(id: string) {
    return this.db.user.findUnique({
      where: { id },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, branchId: true, isActive: true },
    })
  }

  private generateTokens(user: any): AuthTokens {
    const payload = { sub: user.id, email: user.email, role: user.role, branchId: user.branchId }
    const accessToken = this.jwt.sign(payload, { expiresIn: this.config.get('JWT_EXPIRES_IN', '15m') })
    const refreshToken = this.jwt.sign(payload, { expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d') })
    return { accessToken, refreshToken, expiresIn: 900 }
  }
}
