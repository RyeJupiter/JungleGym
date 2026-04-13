import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        jungle: {
          50:  '#f0f9f2',
          100: '#d4edda',
          200: '#a3d4b0',
          300: '#6ab88a',
          400: '#3d9e6b',
          500: '#237a51',
          600: '#1c5c3c',
          700: '#1b4332',
          800: '#122b21',
          900: '#0a1c14',
          950: '#0F1A14',
        },
        earth: {
          300: '#d4a84e',
          400: '#c4892a',
          500: '#a36b1e',
          600: '#7a5018',
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        display: ['var(--font-bricolage)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
