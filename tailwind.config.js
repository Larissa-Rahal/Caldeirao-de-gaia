/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'grimoire':    '0 4px 20px rgba(0,0,0,0.50), 0 0 0 1px rgba(107,63,160,0.20)',
        'grimoire-lg': '0 8px 32px rgba(0,0,0,0.60), 0 0 0 1px rgba(107,63,160,0.30)',
        'amethyst':    '0 0 20px rgba(157,78,221,0.35), 0 4px 14px rgba(0,0,0,0.50)',
        'amber-glow':  '0 0 12px rgba(212,160,23,0.30)',
        'card':        '0 4px 12px rgba(112,0,255,0.06)',
      }
    }
  },
  plugins: []
}
