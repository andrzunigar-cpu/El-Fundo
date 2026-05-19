import Link from 'next/link'
import { clsx } from 'clsx'

const CATEGORIES = [
  { slug: '', label: 'Todos', emoji: '🛒' },
  { slug: 'vacuno', label: 'Vacuno', emoji: '🐄' },
  { slug: 'cerdo', label: 'Cerdo', emoji: '🐷' },
  { slug: 'cordero', label: 'Cordero', emoji: '🐑' },
  { slug: 'pollo', label: 'Pollo', emoji: '🐔' },
]

interface Props { selectedCategory?: string }

export function CategoryFilter({ selectedCategory }: Props) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Categorías</p>
      {CATEGORIES.map(cat => (
        <Link
          key={cat.slug}
          href={cat.slug ? `/products?category=${cat.slug}` : '/products'}
          className={clsx(
            'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full',
            selectedCategory === cat.slug || (!selectedCategory && !cat.slug)
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'text-gray-600 hover:bg-gray-50'
          )}
        >
          <span>{cat.emoji}</span>
          {cat.label}
        </Link>
      ))}
    </div>
  )
}
