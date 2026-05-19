import { Injectable, NotFoundException } from '@nestjs/common'
import { DatabaseService } from '../../database/database.service'

@Injectable()
export class ProductsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(filters: { category?: string; search?: string; page: number; limit: number }) {
    const { page, limit, category, search } = filters
    const skip = (page - 1) * limit

    const where: any = { status: 'active' }
    if (category) where.category = { slug: category }
    if (search) where.name = { contains: search, mode: 'insensitive' }

    const [data, total] = await Promise.all([
      this.db.product.findMany({ where, include: { category: true, stockLevel: true }, skip, take: limit, orderBy: { name: 'asc' } }),
      this.db.product.count({ where }),
    ])
    return { data, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(id: string) {
    const product = await this.db.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: { category: true, stockLevel: true },
    })
    if (!product) throw new NotFoundException('Producto no encontrado')
    return product
  }

  async create(data: any) {
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    return this.db.product.create({ data: { ...data, slug, syncStatus: 'synced', version: 1 } })
  }

  async update(id: string, data: any) {
    return this.db.product.update({ where: { id }, data: { ...data, syncStatus: 'pending', version: { increment: 1 } } })
  }
}
