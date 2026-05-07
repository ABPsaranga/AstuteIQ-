/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Brand ──────────────────────────────────────────────
        brand: {
          300: '#c4a3fb',
          400: '#A78BFA',   // Soft Violet — secondary accents
          500: '#6B2FD9',   // IQ Purple — primary
          600: '#5a27b8',
          700: '#4a1f99',
        },

        // ── Semantic ───────────────────────────────────────────
        pass:    '#2DD4A0',
        fail:    '#FF6B6B',
        warn:    '#FFB347',
        gold:    '#E8B84B',
        success: '#2DD4A0',
        error:   '#FF6B6B',
        warning: '#FFB347',

        // ── Surfaces ───────────────────────────────────────────
        background:  '#0B0B14',   // Deep Night
        surface: {
          DEFAULT:  '#0f0f1a',
          card:     '#0f0f1a',
          hover:    '#141421',
          border:   '#1e1e30',
        },

        // ── Aliases for legacy compatibility ───────────────────
        card: '#0f0f1a',
      },

      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        serif:   ['DM Serif Display', 'Georgia', 'serif'],
        mono:    ['DM Mono', 'Fira Code', 'monospace'],
        display: ['DM Serif Display', 'Georgia', 'serif'],
      },

      borderRadius: {
        xl:  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },

      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.4)',
        glow: '0 0 20px rgba(107,47,217,0.3)',
      },

      animation: {
        'fade-in':  'fadeIn 0.3s ease-out both',
        'slide-up': 'slideUp 0.25s ease-out both',
        'spin':     'spin 0.75s linear infinite',
      },

      keyframes: {
        fadeIn:  {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}