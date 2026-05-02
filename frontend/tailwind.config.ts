import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: '#7132f5',
        'brand-dark': '#5741d8',
        'brand-deep': '#5b1ecf',
        'brand-subtle': 'rgba(133,91,251,0.16)',
        'near-black': '#101114',
        'cool-gray': '#686b82',
        'silver-blue': '#9497a9',
        'border-gray': '#dedee5',
        success: '#149e61',
        'success-bg': 'rgba(20,158,97,0.16)',
        'success-text': '#026b3f',
      },
      fontFamily: {
        ui: ['var(--font-ui)', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['var(--font-ui)', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        button: '12px',
        badge: '8px',
        card: '16px',
      },
      boxShadow: {
        subtle: 'rgba(0,0,0,0.03) 0px 4px 24px',
        micro: 'rgba(16,24,40,0.04) 0px 1px 4px',
      },
    },
  },
  plugins: [],
}

export default config
