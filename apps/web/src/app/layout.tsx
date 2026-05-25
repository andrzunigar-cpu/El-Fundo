import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Carnicería El Fundo | Carnes de Calidad en Puente Alto',
  description: 'Carnes frescas, cortes seleccionados y despacho a domicilio en Puente Alto. Calidad y tradición en cada corte.',
  keywords: 'carnicería, carnes, Puente Alto, Santiago, Chile, despacho a domicilio',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Carnicería El Fundo',
    description: 'Carnes frescas con despacho a domicilio',
    type: 'website',
    locale: 'es_CL',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es-CL">
      <body>{children}</body>
    </html>
  )
}