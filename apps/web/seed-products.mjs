const SUPABASE_URL = 'https://tubrjgkzookemtnvpvdg.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1YnJqZ2t6b29rZW10bnZwdmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MzIxMzYsImV4cCI6MjA5NTEwODEzNn0.qJ8sLl0g0U6q58pFtRelt8fQAOdkXG_mirknJPLkW0I'

// Fotos seleccionadas manualmente para que coincidan con cada producto
const products = [
  // ── Vacuno (kg) ──
  { id: 'prod-vac-001', name: 'Lomo Liso',         category_id: 'cat-vacuno',    unit: 'kg', base_price: 14990, online_price: 14990, is_featured: true,  status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80']) },
  { id: 'prod-vac-002', name: 'Lomo Vetado',        category_id: 'cat-vacuno',    unit: 'kg', base_price: 12990, online_price: 12990, is_featured: true,  status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80']) },
  { id: 'prod-vac-003', name: 'Posta Negra',        category_id: 'cat-vacuno',    unit: 'kg', base_price:  9990, online_price:  9990, is_featured: false, status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80']) },
  { id: 'prod-vac-004', name: 'Asado de Tira',      category_id: 'cat-vacuno',    unit: 'kg', base_price: 10000, online_price: 10000, is_featured: true,  status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1544025162-d76594e8bb25?w=600&q=80']) },
  { id: 'prod-vac-005', name: 'Entraña',            category_id: 'cat-vacuno',    unit: 'kg', base_price: 11990, online_price: 11990, is_featured: true,  status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80']) },
  { id: 'prod-vac-006', name: 'Plateada',           category_id: 'cat-vacuno',    unit: 'kg', base_price:  7990, online_price:  7990, is_featured: false, status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80']) },
  { id: 'prod-vac-007', name: 'Osobuco',            category_id: 'cat-vacuno',    unit: 'kg', base_price:  5990, online_price:  5990, is_featured: false, status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80']) },
  { id: 'prod-vac-008', name: 'Carne Molida',       category_id: 'cat-vacuno',    unit: 'kg', base_price: 10000, online_price: 10000, is_featured: false, status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1551782450-17144efb9c50?w=600&q=80']) },
  // ── Cerdo (kg) ──
  { id: 'prod-cer-001', name: 'Pulpa de Cerdo',     category_id: 'cat-cerdo',     unit: 'kg', base_price:  6990, online_price:  6990, is_featured: false, status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=600&q=80']) },
  { id: 'prod-cer-002', name: 'Costillar de Cerdo', category_id: 'cat-cerdo',     unit: 'kg', base_price:  7990, online_price:  7990, is_featured: true,  status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80']) },
  { id: 'prod-cer-003', name: 'Chuleta Centro',     category_id: 'cat-cerdo',     unit: 'kg', base_price:  5990, online_price:  5990, is_featured: false, status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1432139509613-5c4255815697?w=600&q=80']) },
  // ── Pollo ──
  { id: 'prod-pol-001', name: 'Pollo Entero',       category_id: 'cat-pollo',     unit: 'un', base_price:  3490, online_price:  3490, is_featured: false, status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&q=80']) },
  { id: 'prod-pol-002', name: 'Pechuga de Pollo',   category_id: 'cat-pollo',     unit: 'kg', base_price:  5990, online_price:  5990, is_featured: true,  status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80']) },
  { id: 'prod-pol-003', name: 'Trutro de Pollo',    category_id: 'cat-pollo',     unit: 'kg', base_price:  3990, online_price:  3990, is_featured: false, status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=600&q=80']) },
  // ── Embutidos (un) ──
  { id: 'prod-emb-001', name: 'Longaniza Casera',   category_id: 'cat-embutidos', unit: 'un', base_price:  2990, online_price:  2990, is_featured: false, status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=600&q=80']) },
  { id: 'prod-emb-002', name: 'Chorizo Parrillero', category_id: 'cat-embutidos', unit: 'un', base_price: 10000, online_price: 10000, is_featured: true,  status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=80']) },
  { id: 'prod-emb-003', name: 'Prieta',             category_id: 'cat-embutidos', unit: 'un', base_price:  2490, online_price:  2490, is_featured: false, status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1481833761820-0509d3217039?w=600&q=80']) },
  // ── Parrilla / Cordero (kg) ──
  { id: 'prod-cor-001', name: 'Pierna de Cordero',  category_id: 'cat-parrilla',  unit: 'kg', base_price: 13990, online_price: 13990, is_featured: true,  status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80']) },
  { id: 'prod-cor-002', name: 'Costillar Cordero',  category_id: 'cat-parrilla',  unit: 'kg', base_price: 11990, online_price: 11990, is_featured: false, status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&q=80']) },
  // ── Bebidas (un) ──
  { id: 'prod-beb-1', name: 'Coca Cola 1.5L', category_id: 'cat-bebidas', unit: 'un', base_price: 1500, online_price: 1500, is_featured: false, status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&q=80']) },
  { id: 'prod-beb-2', name: 'Fanta 1.5L',     category_id: 'cat-bebidas', unit: 'un', base_price: 2000, online_price: 2000, is_featured: false, status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&q=80']) },
  // ── Combos (un) ──
  { id: 'prod-combo-001', name: 'Pack Asado Clásico',      category_id: 'cat-combos', unit: 'un', base_price: 38000, online_price: 38000, is_featured: true,  status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80']) },
  { id: 'prod-combo-002', name: 'Pack Parrillero Pro',     category_id: 'cat-combos', unit: 'un', base_price: 55000, online_price: 55000, is_featured: true,  status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80']) },
  { id: 'prod-combo-003', name: 'Pack Familiar Económico', category_id: 'cat-combos', unit: 'un', base_price: 22000, online_price: 22000, is_featured: false, status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&q=80']) },
  { id: 'prod-combo-004', name: 'Pack Cazuela Completa',   category_id: 'cat-combos', unit: 'un', base_price: 18000, online_price: 18000, is_featured: false, status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80']) },
  { id: 'prod-combo-005', name: 'Pack Fin de Semana',      category_id: 'cat-combos', unit: 'un', base_price: 32000, online_price: 32000, is_featured: true,  status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80']) },
  { id: 'prod-combo-006', name: 'Pack Cumpleaños',         category_id: 'cat-combos', unit: 'un', base_price: 75000, online_price: 75000, is_featured: true,  status: 'active', image_urls: JSON.stringify(['https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80']) },
]

fetch(`${SUPABASE_URL}/rest/v1/products`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'resolution=merge-duplicates'
  },
  body: JSON.stringify(products)
}).then(async r => {
  const t = await r.text()
  if (r.ok) console.log(`OK - ${products.length} productos actualizados con fotos correctas`)
  else console.error(`Error ${r.status}:`, t)
})
