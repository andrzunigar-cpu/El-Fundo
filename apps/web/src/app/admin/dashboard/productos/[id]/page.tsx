'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Save, ImageIcon, Loader } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

interface Product {
  id: string
  name: string
  base_price: number
  online_price: number
  meat_type: string
  cut: string
  status: string
  image_urls: string[]
  category_id: string
  is_featured: boolean
  is_available_online: boolean
}

export default function EditProducto() {
  const params = useParams()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${apiUrl}/api/products/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setProduct(data)
        if (data.image_urls && data.image_urls.length > 0) {
          setPreviewUrl(data.image_urls[0])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !product) return

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `productos/${product.id}-${Date.now()}.${ext}`

      const { data, error } = await supabase.storage
        .from('imagenes')
        .upload(fileName, file, { upsert: true })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('imagenes')
        .getPublicUrl(fileName)

      setPreviewUrl(publicUrl)
      setProduct(prev => prev ? { ...prev, image_urls: [publicUrl] } : prev)
    } catch (err) {
      console.error('Error subiendo imagen:', err)
      alert('Error al subir imagen. Verifica que el bucket "imagenes" exista en Supabase Storage.')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!product) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('products')
        .update({
          base_price: product.base_price,
          online_price: product.online_price || product.base_price,
          status: product.status,
          is_featured: product.is_featured,
          is_available_online: product.is_available_online,
          image_urls: JSON.stringify(product.image_urls),
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)

      if (error) throw error
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error guardando:', err)
      alert('Error al guardar cambios')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando...</div>
  if (!product) return <div className="p-8 text-center text-gray-500">Producto no encontrado</div>

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/dashboard/productos" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
          <p className="text-gray-500 text-sm">{product.name}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Imagen */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Imagen del producto</h2>

          <div
            className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-red-400 hover:bg-red-50 transition mb-4 overflow-hidden"
            onClick={() => fileRef.current?.click()}
          >
            {previewUrl ? (
              <img src={previewUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <>
                <ImageIcon className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Click para subir imagen</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP</p>
              </>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            {uploading ? (
              <><Loader className="w-4 h-4 animate-spin" /> Subiendo...</>
            ) : (
              <><Upload className="w-4 h-4" /> Subir imagen</>
            )}
          </button>
        </div>

        {/* Datos */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Información</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={product.name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio local (POS)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    value={product.base_price}
                    onChange={e => setProduct(prev => prev ? { ...prev, base_price: Number(e.target.value) } : prev)}
                    className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio online</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    value={product.online_price || product.base_price}
                    onChange={e => setProduct(prev => prev ? { ...prev, online_price: Number(e.target.value) } : prev)}
                    className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={product.status}
                  onChange={e => setProduct(prev => prev ? { ...prev, status: e.target.value } : prev)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-2">
                <label className="text-sm font-medium text-gray-700">Disponible online</label>
                <button
                  onClick={() => setProduct(prev => prev ? { ...prev, is_available_online: !prev.is_available_online } : prev)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${product.is_available_online ? 'bg-red-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${product.is_available_online ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <label className="text-sm font-medium text-gray-700">Destacado</label>
                <button
                  onClick={() => setProduct(prev => prev ? { ...prev, is_featured: !prev.is_featured } : prev)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${product.is_featured ? 'bg-red-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${product.is_featured ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50"
          >
            {saving ? (
              <><Loader className="w-4 h-4 animate-spin" /> Guardando...</>
            ) : success ? (
              <>✓ Guardado exitosamente</>
            ) : (
              <><Save className="w-4 h-4" /> Guardar cambios</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}