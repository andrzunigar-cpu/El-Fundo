import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const app = express()
const PORT = process.env.PORT || 3001

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', process.env.NEXT_PUBLIC_DOMAIN],
  credentials: true,
}))

app.use(express.json())

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API running' })
})

// GET /api/products - Todos los productos
app.get('/api/products', async (req, res) => {
  try {
    const { category_id } = req.query
    
    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
    
    if (category_id) {
      query = query.eq('category_id', category_id)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    res.json(data || [])
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error fetching products' })
  }
})

// GET /api/products/:id - Producto específico
app.get('/api/products/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single()
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error:', error)
    res.status(404).json({ error: 'Product not found' })
  }
})

// GET /api/categories - Categorías
app.get('/api/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('status', 'active')
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    res.json(data || [])
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error fetching categories' })
  }
})

// GET /api/stock/:productId - Stock disponible
app.get('/api/stock/:productId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stock_levels')
      .select('quantity, reserved_quantity')
      .eq('product_id', req.params.productId)
      .single()
    
    if (error) throw error
    const available = (data?.quantity || 0) - (data?.reserved_quantity || 0)
    res.json({ quantity: available })
  } catch (error) {
    console.error('Error:', error)
    res.status(404).json({ quantity: 0 })
  }
})

// POST /api/orders - Crear orden
app.post('/api/orders', async (req, res) => {
  try {
    const { customer_name, customer_phone, items, total, payment_method } = req.body
    
    // Validar datos
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Items required' })
    }

    // Generar número de orden
    const orderNumber = `EF-${Date.now()}`
    
    // Crear orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        source: 'web',
        status: 'pending',
        payment_status: 'pending',
        customer_name,
        customer_phone,
        subtotal: total,
        total: total,
        payment_method: payment_method || 'pending',
        delivery_type: 'delivery',
      })
      .select()
      .single()
    
    if (orderError) throw orderError

    // Crear items de orden
    for (const item of items) {
      await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.id,
          product_name: item.name,
          product_sku: item.sku || 'N/A',
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
        })
    }

    res.status(201).json({
      id: order.id,
      order_number: order.order_number,
      status: 'pending',
      message: 'Orden creada exitosamente',
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error creating order' })
  }
})

// GET /api/orders/:id - Obtener orden
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single()
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error:', error)
    res.status(404).json({ error: 'Order not found' })
  }
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`\n🚀 Carnicería El Fundo API`)
  console.log(`📍 Running on http://localhost:${PORT}`)
  console.log(`\n✅ Endpoints disponibles:`)
  console.log(`   GET  /api/products`)
  console.log(`   GET  /api/products/:id`)
  console.log(`   GET  /api/categories`)
  console.log(`   GET  /api/stock/:productId`)
  console.log(`   POST /api/orders`)
  console.log(`   GET  /api/orders/:id\n`)
})