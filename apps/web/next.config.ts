import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: false,
    domains: ['carniceriaelfundo.cl', 'localhost'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
}

export default nextConfig
