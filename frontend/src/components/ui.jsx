import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'

/* ============================== ICONS ============================== */
const paths = {
  dashboard: 'M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z',
  upload: 'M12 16V4m0 0l4 4m-4-4L8 8M5 15v4h14v-4',
  history: 'M12 8v4l3 2m6-2a9 9 0 11-2.6-6.3M21 4v5h-5',
  report: 'M9 12h6M9 16h4M7 3h8l4 4v14H7z',
  analytics: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
  settings: 'M4 8h10M18 8h2M4 16h4m6 0h6m-3-8a2 2 0 100 4 2 2 0 000-4zm-8 8a2 2 0 100 4 2 2 0 000-4z',
  chat: 'M21 12a8 8 0 01-8 8H4l2-3a8 8 0 1115-5z',
  check: 'M5 13l4 4L19 7',
  alert: 'M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  plus: 'M12 5v14M5 12h14',
  image: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M9 9h.01',
  pulse: 'M3 12h4l3 8 4-16 3 8h4',
  droplet: 'M12 3s6 6.3 6 11a6 6 0 11-12 0c0-4.7 6-11 6-11z',
  spark: 'M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z',
  x: 'M6 6l12 12M18 6L6 18',
  trash: 'M4 7h16M9 7V4h6v3m-9 0l1 14h10l1-14',
  refresh: 'M21 12a9 9 0 11-2.6-6.3M21 4v5h-5',
  arrow: 'M5 12h14m-6-6l6 6-6 6',
  wave: 'M2 12c2.5 0 2.5 3 5 3s2.5-3 5-3 2.5 3 5 3 2.5-3 5-3',
  shield: 'M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6z',
  radar: 'M12 12l7-7M12 3a9 9 0 109 9M12 7a5 5 0 105 5M12 12h.01',
  anchor: 'M12 8a3 3 0 100-6 3 3 0 000 6zm0 0v13m-7-4c0 2 3 4 7 4s7-2 7-4M5 13H3a2 2 0 002 2m14-2h2a2 2 0 01-2 2',
  chevron: 'M9 6l6 6-6 6',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9',
  menu: 'M4 6h16M4 12h16M4 18h16',
  clock: 'M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z',
  pin: 'M12 21s7-6.1 7-11a7 7 0 10-14 0c0 4.9 7 11 7 11zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zm10 3a3 3 0 100-6 3 3 0 000 6z',
  cpu: 'M9 9h6v6H9zM4 4h4v4H4zM16 4h4v4h-4zM4 16h4v4H4zM16 16h4v4h-4zM8 2v3m8-3v3M8 19v3m8-3v3M2 8h3m-3 8h3m14-8h3m-3 8h3',
  layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5',
  globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zm-9 9h18M12 3c3 3.5 3 14 0 18m0-18c-3 3.5-3 14 0 18',
  zap: 'M13 2L4 14h6l-1 8 9-12h-6z',
  search: 'M11 4a7 7 0 105.2 11.6L21 21',
  download: 'M12 4v12m0 0l-4-4m4 4l4-4M5 20h14',
  users: 'M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1m18 0v-1a4 4 0 00-3-3.9M13 7a4 4 0 11-8 0 4 4 0 018 0zm6 1a4 4 0 010 8',
  send: 'M22 2L11 13m11-11l-7 20-4-9-9-4z',
  fish: 'M6 12c3-4 7-6 11-6 0 0-1 2-1 6s1 6 1 6c-4 0-8-2-11-6zm-4 0c1.5-1 3-1.5 4-1.5S4.5 13 3 14c.5 1 2 1.5 3 1.5S4.5 13 2 12zm14 0h.01',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zm0 0v14m6-12v14',
}

export function Icon({ name, className = 'h-5 w-5', strokeWidth = 1.8 }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] || paths.spark} />
    </svg>
  )
}

/* ============================== REVEAL ============================== */
export function Reveal({ children, delay = 0, y = 28, className = '', once = true }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ============================== PRIMITIVES ============================== */
export function SectionHeader({ eyebrow, title, sub, action, align = 'left' }) {
  return (
    <div className={`mb-8 flex flex-wrap items-end justify-between gap-6 ${align === 'center' ? 'justify-center text-center' : ''}`}>
      <Reveal>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="m-0 max-w-2xl font-display text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
          {title}
        </h2>
        {sub && <p className="mb-0 mt-3 max-w-xl text-sm leading-6 text-slate-400">{sub}</p>}
      </Reveal>
      {action && <Reveal delay={0.1}>{action}</Reveal>}
    </div>
  )
}

export function Btn({ variant = 'primary', className = '', children, ...props }) {
  const styles =
    variant === 'primary' ? 'action'
    : variant === 'danger' ? 'action-secondary !border-rose-400/40 !text-rose-300 hover:!bg-rose-400/10'
    : 'action-secondary'
  return <button className={`${styles} ${className}`} {...props}>{children}</button>
}

export function Badge({ tone = 'cyan', children, className = '' }) {
  const tones = {
    cyan: 'bg-cyan-400/15 text-cyan-300',
    teal: 'bg-teal-400/15 text-teal-300',
    amber: 'bg-amber-400/15 text-amber-300',
    rose: 'bg-rose-400/15 text-rose-300',
    emerald: 'bg-emerald-400/15 text-emerald-300',
    violet: 'bg-violet-400/15 text-violet-300',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}

export function EmptyState({ icon = 'radar', title, sub, action }) {
  return (
    <div className="grid place-items-center px-6 py-16 text-center">
      <div className="grid h-14 w-14 animate-float place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300">
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <p className="mb-0 mt-4 font-display text-base font-bold text-slate-100">{title}</p>
      <p className="mb-0 mt-1.5 max-w-sm text-xs leading-5 text-slate-400">{sub}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ============================== COUNT-UP ============================== */
export function CountUp({ to = 0, suffix = '', prefix = '', duration = 1.6, decimals = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    let raf, start
    const step = (t) => {
      if (!start) start = t
      const p = Math.min((t - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - p, 4)
      setVal(to * eased)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])
  return <span ref={ref}>{prefix}{val.toFixed(decimals).toLocaleString()}{suffix}</span>
}

/* ============================== AMBIENT BUBBLES ============================== */
export function Bubbles({ count = 14, className = '' }) {
  const bubbles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(i * 97) % 100}%`,
        size: 4 + ((i * 37) % 14),
        duration: `${9 + ((i * 53) % 14)}s`,
        delay: `${-((i * 29) % 20)}s`,
      })),
    [count]
  )
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {bubbles.map((b, i) => (
        <span key={i} className="bubble" style={{ left: b.left, width: b.size, height: b.size, animationDuration: b.duration, animationDelay: b.delay }} />
      ))}
    </div>
  )
}

/* ============================== SONAR RADAR ============================== */
export function SonarRadar({ size = 220, className = '', blips = 5 }) {
  const dots = useMemo(
    () =>
      Array.from({ length: blips }, (_, i) => ({
        angle: (i * 360) / blips + 25,
        radius: 28 + ((i * 41) % 46),
        delay: `${(i * 0.7).toFixed(1)}s`,
        hot: i % 3 === 0,
      })),
    [blips]
  )
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      {[100, 74, 48].map((s) => (
        <div key={s} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/25" style={{ width: `${s}%`, height: `${s}%` }} />
      ))}
      <div className="absolute left-1/2 top-0 h-px w-1/2 origin-left bg-cyan-300/15" />
      <div className="absolute left-1/2 top-0 h-1/2 w-1/2 origin-bottom-left">
        <div className="ring-conic h-full w-full animate-sweep" />
      </div>
      {dots.map((d, i) => (
        <span key={i} className={`absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full ${d.hot ? 'bg-rose-400 shadow-glow' : 'bg-cyan-300'} animate-blink`}
          style={{
            transform: `rotate(${d.angle}deg) translateX(${(d.radius / 100) * size * 0.5}px)`,
            animationDelay: d.delay,
          }} />
      ))}
      <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-glow" />
    </div>
  )
}

/* ============================== SPRING NUMBER ============================== */
export function SpringNumber({ value }) {
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { stiffness: 60, damping: 18 })
  const [display, setDisplay] = useState('0')
  useEffect(() => { mv.set(value) }, [value, mv])
  useEffect(() => spring.on('change', (v) => setDisplay(Math.round(v).toLocaleString())), [spring])
  return <span>{display}</span>
}
