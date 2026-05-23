import { NextResponse } from 'next/server'

const CATEGORIES = [
  { id: 'cat-vacuno', name: 'Vacuno', emoji: 'cow' },
  { id: 'cat-cerdo', name: 'Cerdo', emoji: 'pig' },
  { id: 'cat-pollo', name: 'Pollo', emoji: 'chicken' },
  { id: 'cat-embutidos', name: 'Embutidos', emoji: 'hotdog' },
  { id: 'cat-parrilla', name: 'Parrilla', emoji: 'fire' },
  { id: 'cat-congelados', name: 'Congelados', emoji: 'snowflake' },
  { id: 'cat-bebidas', name: 'Bebidas', emoji: 'cup' },
  { id: 'cat-quesos', name: 'Quesos', emoji: 'cheese' },
  { id: 'cat-otros', name: 'Otros', emoji: 'box' },
]

export async function GET() {
  return NextResponse.json(CATEGORIES)
}