/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9fe',
          200: '#c3d6fd',
          300: '#96b6fb',
          400: '#628ef7',
          500: '#3b62f1',
          600: '#2543e6',
          700: '#1d31d3',
          800: '#1e29aa',
          900: '#1e2786',
          950: '#111652',
        },
        accent: {
          pink: '#ec4899',
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          gold: '#f59e0b',
        },
        light: {
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          hover: '#f1f5f9'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-brand': '0 4px 25px -5px rgba(59, 98, 241, 0.25)',
        'glow-accent': '0 4px 25px -5px rgba(236, 72, 153, 0.25)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
