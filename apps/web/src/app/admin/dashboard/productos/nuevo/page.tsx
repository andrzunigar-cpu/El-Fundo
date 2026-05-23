'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, ImageIcon, Loader, Plus, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

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

export default function NuevoProducto() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    category_id: 'cat-vacuno',
    base_price: '',
    online_price: '',
    description: '',
    status: 'active',
    is_featured: false,
  })
  const [images, setImages] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string, val: unknown) => setForm(prev => ({ ...prev, [key]: val }))

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = getSupabase()
      const ext = file.name.split('.').pop()
      const fileName = `productos/new-${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('imagenes').upload(fileName, file, { upsert: true })
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('imagenes').getPublicUrl(fileName)
      setImages(prev => [publicUrl, ...prev])
    } catch {
      setError('Error al subir imagen')
    } finally { setUploading(false) }
  }

  const addImageByUrl = () => {
    if (!imageUrl.trim()) return
    setImages(prev => [imageUrl.trim(), ...prev])
    setImageUrl('')
    setShowUrlInput(false)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('El nombre es requerido'); return }
    if (!form.base_price) { setError('El precio es requerido'); return }
    setSaving(true); setError('')

    try {
      const id = `prod-${form.category_id.replace('cat-', '')}-${Date.now()}`
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: form.name.trim(),
          category_id: form.category_id,
          base_price: Number(form.base_price),
          online_price: Number(form.online_price || form.base_price),
          description: form.description,
          status: form.status,
          is_featured: form.is_featured,
          image_urls: JSON.stringify(images),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      router.push('/admin/dashboard/productos')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear producto')
    } finally { setSaving(false) }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/dashboard/productos" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Producto</h1>
          <p className="text-gray-500 text-sm">Agrega un nuevo producto al catálogo</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition disabled:opacity-50"
        >
          {saving ? <><Loader className="w-4 h-4 animate-spin" /> Creando...</> : <><Save className="w-4 h-4" /> Crear producto</>}
        </button>
      </div>

      {error && <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Imagen */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Imagen del producto</h2>
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3 flex items-center justify-center">
            {images[0] ? (
              <img src={images[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-gray-400">
                <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">Sin imagen</p>
              </div>
            )}
          </div>
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

        {/* Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Información</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="ej: Lomo Liso"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={form.category_id}
                onChange={e => set('category_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={2}
                placeholder="Descripción del corte..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio local *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    value={form.base_price}
                    onChange={e => set('base_price', e.target.value)}
                    placeholder="9990"
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
                    value={form.online_price}
                    onChange={e => set('online_price', e.target.value)}
                    placeholder="= precio local"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={form.status}
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
                onClick={() => set('is_featured', !form.is_featured)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${form.is_featured ? 'bg-red-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition ${form.is_featured ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
