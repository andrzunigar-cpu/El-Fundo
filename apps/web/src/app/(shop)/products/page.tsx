import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ProductCatalog } from '../../../components/shop/ProductCatalog'
import { CategoryFilter } from '../../../components/shop/CategoryFilter'

export const metadata: Metadata = {
  title: 'Catálogo de Productos',
  description: 'Explora nuestra selección de cortes de carne premium. Vacuno, cerdo, cordero y más.',
}

// Revalidar cada 5 minutos para precios y stock
export const revalidate = 300

interface Props {
  searchParams: { category?: string; search?: string; sort?: string; page?: string }
}

export default function ProductsPage({ searchParams }: Props) {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuestros Productos</h1>
          <p className="text-gray-600 mt-1">Cortes frescos seleccionados diariamente</p>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          <CategoryFilter selectedCategory={searchParams.category} />
        </aside>

        <div className="flex-1">
          <Suspense fallback={<ProductCatalogSkeleton />}>
            <ProductCatalog
              category={searchParams.category}
              search={searchParams.search}
              sort={searchParams.sort}
              page={searchParams.page ? parseInt(searchParams.page) : 1}
            />
          </Suspense>
        </div>
      </div>
    </main>
  )
}

function ProductCatalogSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-2xl h-72 animate-pulse" />
      ))}
    </div>
  )
}
