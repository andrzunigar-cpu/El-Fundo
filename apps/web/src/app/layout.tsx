import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { QueryProvider } from '../lib/query-provider'
import { CartProvider } from '../stores/cart-store'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: 'Carnicería El Fundo — Carnes Premium en Chile',
    template: '%s | Carnicería El Fundo',
  },
  description: 'Los mejores cortes de carne vacuna, cerdo y más. Compra online con despacho a domicilio en Santiago.',
  keywords: ['carnicería', 'carne', 'cortes', 'vacuno', 'Santiago', 'Chile', 'despacho'],
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: 'https://carniceriaelfundo.cl',
    siteName: 'Carnicería El Fundo',
  },
  robots: { index: true, follow: true },
  metadataBase: new URL('https://carniceriaelfundo.cl'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body className={inter.className}>
        <QueryProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </QueryProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
