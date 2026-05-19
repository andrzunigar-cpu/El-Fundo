import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
      },
    },
  },
  plugins: [],
}

export default config
