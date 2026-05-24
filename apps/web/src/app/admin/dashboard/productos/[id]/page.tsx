'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, ImageIcon, Loader, Trash2, Plus, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const SB_URL  = 'https://tubrjgkzookemtnvpvdg.supabase.co'
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1YnJqZ2t6b29rZW10bnZwdmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MzIxMzYsImV4cCI6MjA5NTEwODEzNn0.qJ8sLl0g0U6q58pFtRelt8fQAOdkXG_mirknJPLkW0I'
const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  try { if (url) new URL(url) } catch { /* invalid, use fallback */ }
  return createClient(
    (url && url.startsWith('http')) ? url : SB_URL,
    (key && key.length > 20) ? key : SB_ANON
  )
}

const CATEGORIES = [
  { id: 'cat-vacuno',    label: 'Vacuno' },
  { id: 'cat-cerdo',     label: 'Cerdo' },
  { id: 'cat-pollo',     label: 'Pollo / Aves' },
  { id: 'cat-embutidos', label: 'Embutidos' },
  { id: 'cat-parrilla',  label: 'Parrilla / Cordero' },
  { id: 'cat-congelados',label: 'Congelados' },
  { id: 'cat-bebidas',   label: 'Bebidas' },
  { id: 'cat-quesos',    label: 'Quesos' },
]

interface Product {
  id: string
  name: string
  base_price: number
  online_price: number
  promotional_price?: number
  promo_ends_at?: string
  promo_label?: string
  status: string
  image_urls: string | string[]
  category_id: string
  unit?: string
  is_featured: boolean
  description?: string
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
  const [error, setError] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)

  const getImages = (p: Product): string[] => {
    if (!p.image_urls) return []
    if (Array.isArray(p.image_urls)) return p.image_urls
    try { return JSON.parse(p.image_urls) } catch { return [] }
  }

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then(r => r.json())
      .then(data => { setProduct(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !product) return
    setUploading(true)
    try {
      const supabase = getSupabase()
      const ext = file.name.split('.').pop()
      const fileName = `productos/${product.id}-${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('imagenes').upload(fileName, file, { upsert: true })
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('imagenes').getPublicUrl(fileName)
      const imgs = getImages(product)
      setProduct(prev => prev ? { ...prev, image_urls: [publicUrl, ...imgs] } : prev)
    } catch {
      setError('Error al subir imagen. Verifica que el bucket "imagenes" exista en Supabase Storage.')
    } finally { setUploading(false) }
  }

  const addImageByUrl = () => {
    if (!imageUrl.trim() || !product) return
    const imgs = getImages(product)
    setProduct(prev => prev ? { ...prev, image_urls: [imageUrl.trim(), ...imgs] } : prev)
    setImageUrl('')
    setShowUrlInput(false)
  }

  const removeImage = (idx: number) => {
    if (!product) return
    const imgs = getImages(product).filter((_, i) => i !== idx)
    setProduct(prev => prev ? { ...prev, image_urls: imgs } : prev)
  }

  const set = (key: keyof Product, val: unknown) =>
    setProduct(prev => prev ? { ...prev, [key]: val } : prev)

  const handleSave = async () => {
    if (!product) return
    setSaving(true); setError('')
    try {
      const imgs = getImages(product)
      const payload: Record<string, unknown> = {
        name: product.name,
        base_price: Number(product.base_price),
        online_price: Number(product.online_price || product.base_price),
        unit: product.unit || 'kg',
        status: product.status,
        is_featured: product.is_featured,
        category_id: product.category_id,
        image_urls: JSON.stringify(imgs),
        description: product.description || '',
        updated_at: new Date().toISOString(),
      }
      if (product.promotional_price) {
        payload.promotional_price = Number(product.promotional_price)
        payload.promo_label = product.promo_label || 'Oferta'
        payload.promo_ends_at = product.promo_ends_at || null
      } else {
        payload.promotional_price = null
        payload.promo_label = null
        payload.promo_ends_at = null
      }

      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando...</div>
  if (!product) return <div className="p-8 text-center text-gray-500">Producto no encontrado</div>

  const images = getImages(product)

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/dashboard/productos" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
          <p className="text-gray-500 text-sm">{product.name}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`ml-auto flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition ${
            success ? 'bg-green-600 text-white' : 'bg-red-600 text-white hover:bg-red-700'
          } disabled:opacity-50`}
        >
          {saving ? <><Loader className="w-4 h-4 animate-spin" /> Guardando...</> :
           success ? '✓ Guardado' :
           <><Save className="w-4 h-4" /> Guardar cambios</>}
        </button>
      </div>

      {error && <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Col izquierda: Imágenes ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Imágenes del producto</h2>

            {/* Imagen principal */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3 flex items-center justify-center">
              {images[0] ? (
                <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-gray-400">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">Sin imagen</p>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {images.map((url, i) => (
                  <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length === 1 && (
              <button onClick={() => removeImage(0)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 mb-3">
                <Trash2 className="w-3 h-3" /> Quitar imagen
              </button>
            )}

            {/* Botones agregar imagen */}
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {uploading ? 'Subiendo...' : 'Subir archivo'}
              </button>
              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <LinkIcon className="w-4 h-4" /> URL
              </button>
            </div>

            {showUrlInput && (
              <div className="mt-3 flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  onKeyDown={e => e.key === 'Enter' && addImageByUrl()}
                />
                <button onClick={addImageByUrl} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
                  Agregar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Col derecha: Info + Precios + Promoción ── */}
        <div className="space-y-4">
          {/* Info básica */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Información</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto</label>
              <input
                type="text"
                value={product.name}
                onChange={e => set('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={product.category_id}
                  onChange={e => set('category_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Se vende por</label>
                <select
                  value={product.unit || 'kg'}
                  onChange={e => set('unit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="kg">Kilogramo (kg)</option>
                  <option value="un">Unidad (un)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
              <textarea
                value={product.description || ''}
                onChange={e => set('description', e.target.value)}
                rows={2}
                placeholder="Descripción del corte..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={product.status}
                onChange={e => set('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="active">Activo — visible en tienda</option>
                <option value="inactive">Inactivo — oculto</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="text-sm font-medium text-gray-700">Producto destacado</label>
              <button
                onClick={() => set('is_featured', !product.is_featured)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${product.is_featured ? 'bg-red-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition ${product.is_featured ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Precios */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Precios (por {product.unit || 'kg'})</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio local (POS)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    value={product.base_price}
                    onChange={e => set('base_price', e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
                    onChange={e => set('online_price', e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Promoción */}
          <div className="bg-white rounded-xl border border-orange-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏷️</span>
              <h2 className="font-semibold text-gray-900">Promoción</h2>
              {product.promotional_price && (
                <span className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">Activa</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio promocional (por {product.unit || 'kg'})</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  value={product.promotional_price || ''}
                  onChange={e => set('promotional_price', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Dejar vacío para desactivar"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              {product.promotional_price && product.online_price && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  Descuento: {Math.round((1 - product.promotional_price / (product.online_price || product.base_price)) * 100)}% OFF
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta de la promo</label>
              <input
                type="text"
                value={product.promo_label || ''}
                onChange={e => set('promo_label', e.target.value)}
                placeholder="ej: Oferta fin de semana, 2×1, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Válida hasta (opcional)</label>
              <input
                type="datetime-local"
                value={product.promo_ends_at ? product.promo_ends_at.slice(0, 16) : ''}
                onChange={e => set('promo_ends_at', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {product.promotional_price && (
              <button
                onClick={() => { set('promotional_price', undefined); set('promo_label', ''); set('promo_ends_at', '') }}
                className="w-full py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition"
              >
                Desactivar promoción
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save bottom */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition ${
            success ? 'bg-green-600 text-white' : 'bg-red-600 text-white hover:bg-red-700'
          } disabled:opacity-50`}
        >
          {saving ? <><Loader className="w-4 h-4 animate-spin" /> Guardando...</> :
           success ? '✓ Guardado exitosamente' :
           <><Save className="w-4 h-4" /> Guardar cambios</>}
        </button>
      </div>
    </div>
  )
}
