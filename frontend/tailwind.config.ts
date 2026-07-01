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
          purple:  '#3B7A57',
          saffron: '#C4683D',
          cream:   '#F8F2E8',
        },
        forest:  '#3B7A57',
        moss:    '#5A9E63',
        sand:    '#E8DCC4',
        charcoal:'#2C2A28',
        rust:    '#C4683D',
        denim:   '#5557CB',
        golden:  '#D9B04A',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        sans:    ['var(--font-sans)',    'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)',    'monospace'],
        accent:  ['var(--font-heading)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #3B7A57 0%, #5A9E63 50%, #C4683D 100%)',
      },
    },
  },
  plugins: [],
}

export default config
