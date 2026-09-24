import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '../ui'

const links = [
  { label: 'How it works', href: '#how' },
  { label: 'Descent', href: '#descent' },
  { label: 'Detection', href: '#detection' },
  { label: 'Platform', href: '#platform' },
]

export default function Navbar({ onLaunch }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? 'glass shadow-card' : 'bg-transparent'}`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#top" className="group flex items-center gap-3">
          <span className="relative grid h-10 w-10 place-items-center">
            <span className="absolute inset-0 rounded-2xl bg-cyan-400/20 blur-md transition group-hover:bg-cyan-400/40" />
            <svg viewBox="0 0 32 32" className="relative h-9 w-9">
              <circle cx="16" cy="16" r="13" fill="#04121c" stroke="#22d3ee" strokeWidth="2" />
              <path d="M16 16 L16 5 A11 11 0 0 1 24 8 Z" fill="#22d3ee" opacity="0.9" />
              <circle cx="16" cy="16" r="3" fill="#22d3ee" />
            </svg>
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-slate-100">
            Marine<span className="text-gradient">Vision</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-slate-400 transition hover:text-cyan-300">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300 sm:inline-flex">
            <span className="h-1.5 w-1.5 animate-blink rounded-full bg-emerald-300" />
            SIH 2026 Finalist Build
          </span>
          <button onClick={onLaunch} className="action !px-5 !py-2.5 text-xs">
            Launch console <Icon name="arrow" className="h-3.5 w-3.5" />
          </button>
        </div>
      </nav>
    </motion.header>
  )
}
