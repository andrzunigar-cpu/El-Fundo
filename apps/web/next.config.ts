import type { NextConfig } from 'next'

// Content Security Policy — restringe orígenes permitidos
const CSP = [
  "default-src 'self'",
  // Scripts: self + inline necesario para Next.js hydration
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Estilos: self + inline para Tailwind
  "style-src 'self' 'unsafe-inline'",
  // Imágenes: self, data URIs, Unsplash, Supabase storage
  "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://supabase.co",
  // Fetch/XHR: self + Supabase + Transbank
  "connect-src 'self' https://*.supabase.co https://webpay3g.transbank.cl https://webpay3gint.transbank.cl",
  // Iframes: solo Google Maps
  "frame-src https://www.google.com https://maps.google.com",
  // Fuentes: solo self
  "font-src 'self'",
  // Objetos embebidos: ninguno
  "object-src 'none'",
  // Base URI restringida
  "base-uri 'self'",
  // Formularios solo al mismo origen
  "form-action 'self'",
  // No puede ser embebida en iframes externos (refuerza X-Frame-Options)
  "frame-ancestors 'none'",
  // Upgrade HTTP → HTTPS automáticamente
  "upgrade-insecure-requests",
].join('; ')

const securityHeaders = [
  // Content Security Policy completa
  { key: 'Content-Security-Policy',  value: CSP },
  // Impide que la página sea cargada en un iframe (clickjacking)
  { key: 'X-Frame-Options',          value: 'DENY' },
  // Impide MIME-type sniffing
  { key: 'X-Content-Type-Options',   value: 'nosniff' },
  // Controla qué info se envía en el header Referer
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  // Restringe permisos del navegador
  { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Fuerza HTTPS por 1 año
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  // Protección XSS legacy
  { key: 'X-XSS-Protection',         value: '1; mode=block' },
  // DNS prefetch
  { key: 'X-DNS-Prefetch-Control',   value: 'on' },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: false,
    domains: ['carniceriaelfundo.cl', 'localhost', 'images.unsplash.com', 'tubrjgkzookemtnvpvdg.supabase.co'],
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
