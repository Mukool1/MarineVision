import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Bubbles, Icon, Reveal } from '../ui'

export function FinalCTA({ onLaunch }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const y = useTransform(scrollYProgress, [0, 1], [80, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1])

  return (
    <section ref={ref} className="relative overflow-hidden py-28 sm:py-36">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <motion.div style={{ y, scale }} className="vignette grain relative overflow-hidden rounded-[2.5rem] border border-cyan-300/20 shadow-glow-lg">
          <img src="/img/hero-sonar.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#04121c]/60 via-[#04121c]/80 to-[#020a10]/95" />
          <Bubbles count={10} />
          <div className="relative z-10 px-8 py-16 text-center sm:px-16 sm:py-20">
            <Reveal>
              <span className="mx-auto grid h-16 w-16 animate-float place-items-center rounded-3xl border border-cyan-300/30 bg-cyan-400/15 text-cyan-200 shadow-glow">
                <Icon name="droplet" className="h-7 w-7" />
              </span>
              <h2 className="m-0 mx-auto mt-7 max-w-2xl font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                The ocean is speaking in sonar. <span className="text-gradient">Start listening.</span>
              </h2>
              <p className="m-0 mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-300">
                Step into the MarineVision console — run a scan, interrogate it with AI,
                and turn detections into action before the next tide.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <button onClick={onLaunch} className="action !px-9 !py-4 text-base">
                  Enter the console <Icon name="arrow" className="h-4 w-4" />
                </button>
                <a href="#top" className="action-secondary !px-8 !py-4 !text-slate-100">Back to surface</a>
              </div>
            </Reveal>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#020a10]">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="m-0 font-display text-xl font-bold text-slate-100">
              Marine<span className="text-gradient">Vision</span>
            </p>
            <p className="m-0 mt-2 max-w-sm text-xs leading-5 text-slate-500">
              AI-powered sonar intelligence for marine debris, wreckage and underwater hazards.
              Built for Smart India Hackathon 2026.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs font-semibold text-slate-400">
            {[
              ['How it works', '#how'],
              ['Descent', '#descent'],
              ['Detection', '#detection'],
              ['Platform', '#platform'],
            ].map(([label, href]) => (
              <a key={href} href={href} className="transition hover:text-cyan-300">{label}</a>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/[.07] pt-6 text-[11px] text-slate-600 sm:flex-row sm:items-center">
          <span>© 2026 MarineVision · Crafted for the oceans</span>
          <span className="inline-flex items-center gap-2 font-mono">
            <span className="h-1.5 w-1.5 animate-blink rounded-full bg-cyan-400" />
            SONAR LINK · STABLE
          </span>
        </div>
      </div>
    </footer>
  )
}
