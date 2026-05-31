import type { NextConfig } from 'next'

const securityHeaders = [
  // Impide que la página sea cargada en un iframe (clickjacking)
  { key: 'X-Frame-Options',        value: 'DENY' },
  // Impide MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Controla qué info se envía en el header Referer
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
  // Restringe permisos del navegador
  { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=()' },
  // Fuerza HTTPS por 1 año (solo en producción, Vercel lo aplica igual)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  // Protección XSS legacy (Chrome < 78, IE)
  { key: 'X-XSS-Protection',       value: '1; mode=block' },
  // DNS prefetch control
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: false,
    domains: ['carniceriaelfundo.cl', 'localhost', 'images.unsplash.com'],
  },
  compress:       true,
  poweredByHeader: false,   // No exponer X-Powered-By: Next.js
  generateEtags:  true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Cabeceras adicionales para rutas API
      {
        source: '/api/(.*)',
        headers: [
          ...securityHeaders,
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ]
  },
}

export default nextConfig
