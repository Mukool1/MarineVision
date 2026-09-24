/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        abyss: { 950: '#030b12', 900: '#04121c', 800: '#071c2a', 700: '#0a2a3d' },
        biolum: { 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 32px -6px rgba(34,211,238,.45)',
        'glow-lg': '0 0 64px -8px rgba(34,211,238,.5)',
        card: '0 18px 50px -18px rgba(2,8,15,.9)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        drift: { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '50%': { transform: 'translate(24px,-18px) scale(1.08)' } },
        rise: { '0%': { transform: 'translateY(0) scale(1)', opacity: '0' }, '12%': { opacity: '.8' }, '100%': { transform: 'translateY(-110vh) scale(1.4)', opacity: '0' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        sweep: { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
        pingSlow: { '0%': { transform: 'scale(1)', opacity: '.7' }, '100%': { transform: 'scale(2.4)', opacity: '0' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.25' } },
        scanline: { '0%': { top: '0%' }, '100%': { top: '100%' } },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        drift: 'drift 14s ease-in-out infinite',
        marquee: 'marquee 28s linear infinite',
        sweep: 'sweep 5s linear infinite',
        'ping-slow': 'pingSlow 2.6s cubic-bezier(0,0,.2,1) infinite',
        shimmer: 'shimmer 2.2s linear infinite',
        blink: 'blink 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
