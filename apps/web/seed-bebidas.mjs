/**
 * Seed bebidas — El Fundo
 * node seed-bebidas.mjs
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://tubrjgkzookemtnvpvdg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1YnJqZ2t6b29rZW10bnZwdmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MzIxMzYsImV4cCI6MjA5NTEwODEzNn0.qJ8sLl0g0U6q58pFtRelt8fQAOdkXG_mirknJPLkW0I'
)

// Imágenes por tipo
const IMG = {
  cola_25:    'https://images.unsplash.com/photo-MRMVqUaNZSE?w=400&q=80',
  cola_15:    'https://images.unsplash.com/photo-aJ8CYMhemc8?w=400&q=80',
  cola_lata:  'https://images.unsplash.com/photo-Qvnohn4GyJA?w=400&q=80',
  fanta_25:   'https://images.unsplash.com/photo-nJguJaHo5dg?w=400&q=80',
  fanta_lata: 'https://images.unsplash.com/photo-aHp47GFJqqw?w=400&q=80',
  sprite_bot: 'https://images.unsplash.com/photo-4KLT91f3mAM?w=400&q=80',
  sprite_can: 'https://images.unsplash.com/photo-RH2ZA73kHiA?w=400&q=80',
  sprite_lata:'https://images.unsplash.com/photo-oaE6Zllcc6Y?w=400&q=80',
  monster_a:  'https://images.unsplash.com/photo-Bf-K7BbYIMo?w=400&q=80',
  monster_b:  'https://images.unsplash.com/photo-snQCK9ghEaA?w=400&q=80',
  monster_c:  'https://images.unsplash.com/photo-boZnep9tiEM?w=400&q=80',
  agua_a:     'https://images.unsplash.com/photo-0_he2akLhyA?w=400&q=80',
  agua_b:     'https://images.unsplash.com/photo-UK_jYMqoHxE?w=400&q=80',
  isotonica:  'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80',
  jugo_a:     'https://images.unsplash.com/photo-zc-rZTYKGzc?w=400&q=80',
  jugo_b:     'https://images.unsplash.com/photo-A6c4cUoFrHg?w=400&q=80',
}

const BEBIDAS = [
  // ── Coca-Cola ─────────────────────────────────────────
  { name: 'Coca-Cola Original Desechable 2,5 lt',       price: 12702, img: IMG.cola_25   },
  { name: 'Coca-Cola Original Desechable 1,5 lt x6',   price:  9614, img: IMG.cola_15   },
  { name: 'Coca-Cola Original Lata 350 ml x6',         price:  4416, img: IMG.cola_lata },
  { name: 'Coca-Cola Zero Azúcar Desechable 2,5 lt',   price: 12702, img: IMG.cola_25   },
  { name: 'Coca-Cola Zero Azúcar Desechable 1,5 lt x6',price:  9614, img: IMG.cola_15   },
  { name: 'Coca-Cola Zero Azúcar Lata 350 ml x6',      price:  4416, img: IMG.cola_lata },

  // ── Fanta ─────────────────────────────────────────────
  { name: 'Fanta Naranja Desechable 2,5 lt x6',        price: 12702, img: IMG.fanta_25  },
  { name: 'Fanta Naranja Desechable 1,5 lt x6',        price:  9614, img: IMG.fanta_25  },
  { name: 'Fanta Naranja Lata 350 ml x6',              price:  4415, img: IMG.fanta_lata},

  // ── Sprite ────────────────────────────────────────────
  { name: 'Sprite Desechable 2,5 lt x6',               price: 12702, img: IMG.sprite_bot},
  { name: 'Sprite Desechable 1,5 lt x6',               price:  9614, img: IMG.sprite_can},
  { name: 'Sprite Lata 350 ml x6',                     price:  4416, img: IMG.sprite_lata},

  // ── Monster ───────────────────────────────────────────
  { name: 'Monster Energy 473 ml x6',                  price:  9295, img: IMG.monster_a },
  { name: 'Monster Energy Zero Sugar 473 ml x6',       price:  9295, img: IMG.monster_b },
  { name: 'Monster Ultra 473 ml x6',                   price:  9295, img: IMG.monster_c },
  { name: 'Monster Ripper 473 ml x6',                  price:  9295, img: IMG.monster_b },
  { name: 'Monster Pipeline Punch 473 ml x6',          price:  9295, img: IMG.monster_a },

  // ── Benedictino ───────────────────────────────────────
  { name: 'Benedictino Con Gas 500 ml x12',            price:  6601, img: IMG.agua_a    },
  { name: 'Benedictino Sin Gas 500 ml x12',            price:  6601, img: IMG.agua_b    },
  { name: 'Benedictino Con Gas 1,5 lt x6',             price:  4644, img: IMG.agua_a    },
  { name: 'Benedictino Sin Gas 1,5 lt x6',             price:  4644, img: IMG.agua_b    },

  // ── Aquarius ──────────────────────────────────────────
  { name: 'Aquarius Uva 1,6 lt x6',                    price:  5251, img: IMG.isotonica },
  { name: 'Aquarius Pera 1,6 lt x6',                   price:  5251, img: IMG.isotonica },
  { name: 'Aquarius Manzana 1,6 lt x6',                price:  5251, img: IMG.isotonica },
  { name: 'Aquarius Uva 500 ml x6',                    price:  3785, img: IMG.isotonica },
  { name: 'Aquarius Pera 500 ml x6',                   price:  3785, img: IMG.isotonica },
  { name: 'Aquarius Manzana 500 ml x6',                price:  3785, img: IMG.isotonica },

  // ── Del Valle ─────────────────────────────────────────
  { name: 'Del Valle Durazno 1,5 lt x6',               price:  7736, img: IMG.jugo_a    },
  { name: 'Del Valle Naranja 1,75 lt x6',              price:  6948, img: IMG.jugo_b    },
]

const rows = BEBIDAS.map((b, i) => ({
  id:           `beb-${String(i + 1).padStart(3, '0')}`,
  name:         b.name,
  base_price:   b.price,
  online_price: b.price,
  category_id:  'cat-bebidas',
  status:       'active',
  unit:         'un',
  image_urls:   JSON.stringify([b.img]),
  is_featured:  false,
}))

async function upsert(rows) {
  // Primero intenta con todos los campos
  const { error } = await supabase.from('products').upsert(rows, { onConflict: 'id' })
  if (!error) return { error: null }

  // Si falla por columna faltante, quitar y reintentar
  const missing = error.message.match(/['"]([a-z_]+)['"]/i)?.[1]
  if (missing) {
    console.warn(`⚠️  Columna '${missing}' no existe, reintentando sin ella...`)
    const clean = rows.map(r => { const c = { ...r }; delete c[missing]; return c })
    return supabase.from('products').upsert(clean, { onConflict: 'id' })
  }
  return { error }
}

const { error } = await upsert(rows)
if (error) {
  console.error('❌ Error:', error.message)
} else {
  console.log(`✅ ${rows.length} bebidas insertadas/actualizadas en cat-bebidas`)
}
