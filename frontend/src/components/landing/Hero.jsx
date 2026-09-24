import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Bubbles, Icon, SonarRadar } from '../ui'

const ease = [0.22, 1, 0.36, 1]

function Stagger({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

const chips = [
  { icon: 'radar', label: 'YOLOv8 sonar detection' },
  { icon: 'spark', label: 'AI field analyst' },
  { icon: 'shield', label: 'Wreck & hazard mapping' },
]

export default function Hero({ onLaunch }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '28%'])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.18])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '60%'])

  return (
    <section ref={ref} id="top" className="vignette grain relative flex min-h-[108vh] items-center overflow-hidden">
      {/* Parallax backdrop */}
      <motion.div style={{ y: bgY, scale: bgScale }} className="absolute inset-0">
        <img src="/img/hero-sonar.webp" alt="" className="h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030b12]/70 via-[#030b12]/35 to-[#030b12]" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_45%,transparent_40%,rgba(3,11,18,.7)_100%)]" />
      </motion.div>

      <Bubbles count={18} />
      <Bubbles count={0} />

      <motion.div style={{ opacity: fade, y: contentY }} className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-32 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <Stagger delay={0.15}>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[.2em] text-cyan-200 backdrop-blur">
                <Icon name="wave" className="h-3.5 w-3.5" />
                AI sonar intelligence platform
              </span>
            </Stagger>

            <Stagger delay={0.28}>
              <h1 className="mb-0 mt-7 font-display text-5xl font-bold leading-[1.02] tracking-tight text-white sm:text-7xl">
                See the ocean.
                <br />
                <span className="shimmer-text">Act before it breaks.</span>
              </h1>
            </Stagger>

            <Stagger delay={0.42}>
              <p className="mb-0 mt-6 max-w-xl text-base leading-7 text-slate-300/90 sm:text-lg">
                MarineVision turns side-scan sonar frames into living maps of marine debris,
                wreckage and underwater hazards — detected by AI, reviewed by analysts,
                and handed to cleanup crews as field-ready intelligence.
              </p>
            </Stagger>

            <Stagger delay={0.56}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <button onClick={onLaunch} className="action !px-8 !py-4 text-base">
                  Launch the console <Icon name="arrow" className="h-4 w-4" />
                </button>
                <a href="#how" className="action-secondary !px-8 !py-4 text-base !text-slate-100">
                  <Icon name="eye" className="h-4 w-4" /> See how it works
                </a>
              </div>
            </Stagger>

            <Stagger delay={0.7}>
              <div className="mt-10 flex flex-wrap gap-3">
                {chips.map((c) => (
                  <span key={c.label} className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-slate-200">
                    <Icon name={c.icon} className="h-3.5 w-3.5 text-cyan-300" />
                    {c.label}
                  </span>
                ))}
              </div>
            </Stagger>
          </div>

          {/* Radar visual */}
          <Stagger delay={0.5}>
            <div className="relative mx-auto hidden w-fit lg:block">
              <div className="absolute -inset-10 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="glass grain relative overflow-hidden rounded-[2.5rem] p-8 shadow-glow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="m-0 font-mono text-[10px] uppercase tracking-[.2em] text-cyan-300/70">Live sweep</p>
                    <p className="m-0 mt-1 font-display text-sm font-bold text-slate-100">Sector 7 · Kochi Coast</p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-rose-400/15 px-2.5 py-1 font-mono text-[10px] font-bold text-rose-300">
                    <span className="h-1.5 w-1.5 animate-blink rounded-full bg-rose-400" /> 3 TARGETS
                  </span>
                </div>
                <SonarRadar size={300} blips={7} className="mx-auto" />
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  {[
                    ['2.4 km²', 'mapped'],
                    ['98.2%', 'precision'],
                    ['< 40 s', 'per scan'],
                  ].map(([v, l]) => (
                    <div key={l} className="rounded-xl border border-white/10 bg-white/[.03] px-2 py-2.5">
                      <p className="m-0 font-display text-sm font-bold text-cyan-200">{v}</p>
                      <p className="m-0 mt-0.5 text-[9px] uppercase tracking-widest text-slate-500">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* floating tag */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="glass absolute -right-8 -top-6 rounded-2xl px-4 py-3 shadow-card"
              >
                <p className="m-0 font-mono text-[10px] text-rose-300">⚠ Ghost net · 94%</p>
                <p className="m-0 mt-0.5 text-[10px] text-slate-400">12.4 m depth</p>
              </motion.div>
            </div>
          </Stagger>
        </div>

        {/* scroll cue */}
        <motion.a
          href="#how"
          style={{ opacity: fade }}
          className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-slate-400 transition hover:text-cyan-300 md:flex"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-[10px] font-bold uppercase tracking-[.3em]">Dive deeper</span>
          <span className="h-10 w-6 rounded-full border border-slate-500/60 p-1">
            <span className="block h-2 w-2 animate-bounce rounded-full bg-cyan-300" />
          </span>
        </motion.a>
      </motion.div>
    </section>
  )
}
