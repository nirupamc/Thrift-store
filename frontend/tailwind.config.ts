import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './providers/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#5B21B6',
          saffron: '#EA580C',
          cream:  '#FEF9EF',
        },
      },
      fontFamily: {
        heading: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 40%, #EA580C 100%)',
      },
    },
  },
  plugins: [],
}

export default config
