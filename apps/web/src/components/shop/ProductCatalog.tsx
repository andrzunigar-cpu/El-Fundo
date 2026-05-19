import { apiClient } from '../../lib/api-client'
import { ProductCard } from './ProductCard'

interface Props {
  category?: string
  search?: string
  sort?: string
  page: number
}

// Server component — fetcha directamente en el servidor
async function getProducts(props: Props) {
  try {
    const params = new URLSearchParams()
    if (props.category) params.set('category', props.category)
    if (props.search) params.set('search', props.search)
    params.set('page', String(props.page))
    params.set('limit', '20')

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?${params}`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) throw new Error('Error fetching products')
    return res.json()
  } catch {
    // Fallback con datos de demostración si la API no está disponible
    return { data: DEMO_PRODUCTS, total: DEMO_PRODUCTS.length, totalPages: 1 }
  }
}

export async function ProductCatalog(props: Props) {
  const { data: products } = await getProducts(props)

  if (!products.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-xl">No hay productos disponibles</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product: any) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

// Datos de demo para mostrar sin API
const DEMO_PRODUCTS = [
  { id: '1', name: 'Lomo Liso', basePrice: 9990, onlinePrice: 9490, requiresWeight: true, priceUnit: 'kg', meatType: 'vacuno', cut: 'lomo_liso', slug: 'lomo-liso', imageUrls: [], stockLevel: { quantity: 15 } },
  { id: '2', name: 'Posta Negra', basePrice: 8490, onlinePrice: 7990, requiresWeight: true, priceUnit: 'kg', meatType: 'vacuno', cut: 'posta_negra', slug: 'posta-negra', imageUrls: [], stockLevel: { quantity: 8 } },
  { id: '3', name: 'Entraña', basePrice: 12990, onlinePrice: 12490, requiresWeight: true, priceUnit: 'kg', meatType: 'vacuno', cut: 'entraña', slug: 'entrana', imageUrls: [], stockLevel: { quantity: 4 } },
  { id: '4', name: 'Lomo Vetado', basePrice: 10990, onlinePrice: 10490, requiresWeight: true, priceUnit: 'kg', meatType: 'vacuno', cut: 'lomo_vetado', slug: 'lomo-vetado', imageUrls: [], stockLevel: { quantity: 12 } },
  { id: '5', name: 'Plateada', basePrice: 7490, onlinePrice: 6990, requiresWeight: true, priceUnit: 'kg', meatType: 'vacuno', cut: 'plateada', slug: 'plateada', imageUrls: [], stockLevel: { quantity: 20 } },
  { id: '6', name: 'Asado Carnicero', basePrice: 6990, onlinePrice: 6490, requiresWeight: true, priceUnit: 'kg', meatType: 'vacuno', cut: 'asado_carnicero', slug: 'asado-carnicero', imageUrls: [], stockLevel: { quantity: 10 } },
  { id: '7', name: 'Chuleta de Cerdo', basePrice: 5990, onlinePrice: 5490, requiresWeight: true, priceUnit: 'kg', meatType: 'cerdo', cut: 'chuleta', slug: 'chuleta-cerdo', imageUrls: [], stockLevel: { quantity: 18 } },
  { id: '8', name: 'Osobuco', basePrice: 5490, onlinePrice: 4990, requiresWeight: true, priceUnit: 'kg', meatType: 'vacuno', cut: 'osobuco', slug: 'osobuco', imageUrls: [], stockLevel: { quantity: 6 } },
]
