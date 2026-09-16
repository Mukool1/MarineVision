/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Syne', 'Outfit', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        surface: 'var(--surface)',
        canvas: 'var(--canvas)',
        line: 'var(--line)',
        cyan: {
          50: '#e0f2fe',
          100: '#bae6fd',
          200: '#7dd3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          DEFAULT: 'var(--accent)',
        },
        navy: 'var(--navy)',
        glow: 'var(--glow)',
        coral: 'var(--coral)',
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        glow: '0 0 40px rgba(34, 211, 238, .18)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(45, 212, 191, .45)' },
          '50%': { boxShadow: '0 0 0 14px rgba(45, 212, 191, 0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        wave: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        bubble: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '.35' },
          '100%': { transform: 'translateY(-110vh) scale(1.2)', opacity: '0' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0) rotate(0deg)' },
          '50%': { transform: 'translate3d(12px,-18px,0) rotate(8deg)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp .7s cubic-bezier(.22,1,.36,1) both',
        float: 'float 5s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2.4s ease-out infinite',
        wave: 'wave 14s linear infinite',
        bubble: 'bubble 16s linear infinite',
        drift: 'drift 12s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
