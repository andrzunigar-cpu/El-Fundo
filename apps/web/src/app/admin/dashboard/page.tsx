'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Tag, TrendingUp, ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, categories: 0 })

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    Promise.all([
      fetch(`${apiUrl}/api/products`).then(r => r.json()).catch(() => []),
      fetch(`${apiUrl}/api/categories`).then(r => r.json()).catch(() => []),
    ]).then(([products, categories]) => {
      setStats({
        products: Array.isArray(products) ? products.length : 0,
        categories: Array.isArray(categories) ? categories.length : 0,
      })
    })
  }, [])

  const cards = [
    { label: 'Productos', value: stats.products, icon: Package, href: '/admin/dashboard/productos', color: 'bg-blue-50 text-blue-600' },
    { label: 'Categorías', value: stats.categories, icon: Tag, href: '/admin/dashboard/categorias', color: 'bg-green-50 text-green-600' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen de tu tienda</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {cards.map(card => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="text-gray-500 text-sm mt-1">{card.label}</p>
            </Link>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-900 mb-4">Acciones rápidas</h2>
        <div className="space-y-3">
          <Link href="/admin/dashboard/productos" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
            <Package className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-gray-700">Gestionar productos y precios</span>
            <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>
          <Link href="/admin/dashboard/categorias" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
            <Tag className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-gray-700">Gestionar categorías</span>
            <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>
          <Link href="/" target="_blank" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
            <TrendingUp className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-gray-700">Ver tienda pública</span>
            <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>
        </div>
      </div>
    </div>
  )
}