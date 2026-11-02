/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  'rgb(var(--rgb-primary-50) / <alpha-value>)',
          100: 'rgb(var(--rgb-primary-100) / <alpha-value>)',
          200: 'rgb(var(--rgb-primary-200) / <alpha-value>)',
          300: 'rgb(var(--rgb-primary-300) / <alpha-value>)',
          400: 'rgb(var(--rgb-primary-400) / <alpha-value>)',
          500: 'rgb(var(--rgb-primary-500) / <alpha-value>)',
          600: 'rgb(var(--rgb-primary-600) / <alpha-value>)',
          700: 'rgb(var(--rgb-primary-700) / <alpha-value>)',
          800: 'rgb(var(--rgb-primary-800) / <alpha-value>)',
          900: 'rgb(var(--rgb-primary-900) / <alpha-value>)',
        },

        /* ── Tokens Semânticos ligados a src/styles/colors.css ── */
        page:   'rgb(var(--rgb-page) / <alpha-value>)',
        card:   'rgb(var(--rgb-card) / <alpha-value>)',
        raised: 'rgb(var(--rgb-raised) / <alpha-value>)',
        input:  'rgb(var(--rgb-input) / <alpha-value>)',

        header: {
          DEFAULT: 'rgb(var(--rgb-navbar) / <alpha-value>)',
          pill:    'rgb(var(--rgb-header-pill) / <alpha-value>)',
          hover:   'rgb(var(--rgb-header-pill-hover) / <alpha-value>)',
          alert:   'rgb(var(--rgb-header-alert) / <alpha-value>)',
        },

        gold: {
          DEFAULT: 'rgb(var(--rgb-gold) / <alpha-value>)',
          light:   'rgb(var(--rgb-gold-light) / <alpha-value>)',
          bright:  'rgb(var(--rgb-gold-bright) / <alpha-value>)',
          dark:    'rgb(var(--rgb-gold-dark) / <alpha-value>)',
          cream:   'rgb(var(--rgb-gold-cream) / <alpha-value>)',
        },

        grimoire: {
          text:  'rgb(var(--rgb-grimoire-text) / <alpha-value>)',
          sub:   'rgb(var(--rgb-grimoire-sub) / <alpha-value>)',
          muted: 'rgb(var(--rgb-grimoire-muted) / <alpha-value>)',
        },

        parchment: {
          light:        'rgb(var(--rgb-parchment-light) / <alpha-value>)',
          mid:          'rgb(var(--rgb-parchment-mid) / <alpha-value>)',
          dark:         'rgb(var(--rgb-parchment-dark) / <alpha-value>)',
          ink:          'rgb(var(--rgb-parchment-ink) / <alpha-value>)',
          border:       'rgb(var(--rgb-parchment-border) / <alpha-value>)',
          'scroll-top': 'rgb(var(--rgb-scroll-top) / <alpha-value>)',
          'scroll-mid': 'rgb(var(--rgb-scroll-mid) / <alpha-value>)',
          'scroll-bot': 'rgb(var(--rgb-scroll-bot) / <alpha-value>)',
          'bronze-top': 'rgb(var(--rgb-bronze-top) / <alpha-value>)',
          'bronze-bot': 'rgb(var(--rgb-bronze-bot) / <alpha-value>)',
          'bronze-bdr': 'rgb(var(--rgb-bronze-border) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'grimoire':       'var(--shadow-grimoire)',
        'grimoire-lg':    'var(--shadow-grimoire-lg)',
        'amethyst':       'var(--shadow-amethyst)',
        'amber-glow':     'var(--shadow-amber-glow)',
        'medallion-glow': 'var(--shadow-medallion-glow)',
        'plaque-glow':    'var(--shadow-plaque-glow)',
        'aura-instock':   'var(--shadow-aura-instock)',
        'aura-low':       'var(--shadow-aura-low)',
        'aura-out':       'var(--shadow-aura-out)',
        'card':           'var(--shadow-card-subtle)',
      },
    },
  },
  plugins: [],
}
