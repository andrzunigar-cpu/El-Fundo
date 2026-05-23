'use client'

import { useEffect, useState } from 'react'
import { Tag, Check } from 'lucide-react'

const CATS = [
  { id: 'cat-vacuno', name: 'Vacuno', emoji: '🐄' },
  { id: 'cat-cerdo', name: 'Cerdo', emoji: '🐷' },
  { id: 'cat-pollo', name: 'Pollo', emoji: '🐔' },
  { id: 'cat-embutidos', name: 'Embutidos', emoji: '🌭' },
  { id: 'cat-parrilla', name: 'Parrilla', emoji: '🔥' },
  { id: 'cat-congelados', name: 'Congelados', emoji: '❄️' },
  { id: 'cat-bebidas', name: 'Bebidas', emoji: '🥤' },
  { id: 'cat-quesos', name: 'Quesos', emoji: '🧀' },
  { id: 'cat-otros', name: 'Otros', emoji: '📦' },
]

export default function CategoriasAdmin() {
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${apiUrl}/api/products`)
      .then(r => r.json())
      .then(products => {
        if (!Array.isArray(products)) return
        const c: Record<string, number> = {}
        products.forEach((p: any) => {
          c[p.category_id] = (c[p.category_id] || 0) + 1
        })
        setCounts(c)
      })
  }, [])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
        <p className="text-gray-500 text-sm mt-1">{CATS.length} categorías configuradas</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {CATS.map(cat => (
          <div key={cat.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="text-4xl">{cat.emoji}</div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{cat.name}</h3>
              <p className="text-sm text-gray-500">{counts[cat.id] || 0} productos</p>
            </div>
            <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-2.5 py-1 rounded-full text-xs font-medium">
              <Check className="w-3 h-3" /> Activa
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}