import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Badge, Icon, Reveal, SectionHeader } from '../ui'

// Box geometry measured against /img/detection-showcase.webp (percent of frame).
const boxes = [
  { x: 20.0, y: 12.4, w: 13.7, h: 20.1, label: 'Tire · 91%', tone: '#f59e0b' },
  { x: 38.2, y: 35.8, w: 17.5, h: 24.3, label: 'Fishing net · 94%', tone: '#ef4444' },
  { x: 62.0, y: 57.3, w: 18.4, h: 25.3, label: 'Metal barrel · 87%', tone: '#22d3ee' },
]

const corners = [
  'left-0 top-0 rounded-tl-md border-l-2 border-t-2',
  'right-0 top-0 rounded-tr-md border-r-2 border-t-2',
  'bottom-0 left-0 rounded-bl-md border-b-2 border-l-2',
  'bottom-0 right-0 rounded-br-md border-b-2 border-r-2',
]

export default function Showcase() {
  const [pos, setPos] = useState(50)
  const [revealed, setRevealed] = useState(false)
  const track = useRef(null)

  const move = (clientX) => {
    const r = track.current.getBoundingClientRect()
    setPos(Math.min(96, Math.max(4, ((clientX - r.left) / r.width) * 100)))
  }

  return (
    <section id="detection" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeader
          eyebrow="Live detection"
          title={<>Drag the sonar line. <span className="text-gradient">Watch AI think.</span></>}
          sub="A real frame from the detection core. Slide to compare raw sonar against the annotated review overlay."
          action={<Badge tone="rose"><span className="h-1.5 w-1.5 animate-blink rounded-full bg-rose-400" /> 3 targets found</Badge>}
        />

        <Reveal>
          <div
            ref={track}
            onMouseMove={(e) => e.buttons === 1 && move(e.clientX)}
            onTouchMove={(e) => move(e.touches[0].clientX)}
            onClick={(e) => move(e.clientX)}
            onMouseEnter={() => setRevealed(true)}
            className="grain relative cursor-ew-resize select-none overflow-hidden rounded-[2rem] border border-white/10 shadow-glow-lg"
          >
            {/* base: annotated */}
            <div className="relative">
            {/* raw layer (full width, desaturated) */}
            <img
              src="/img/detection-showcase.webp"
              alt="Raw sonar frame"
              draggable={false}
              className="block w-full object-cover"
              style={{ filter: 'saturate(.15) brightness(.62) contrast(1.05)' }}
            />
            {/* annotated layer clipped from the right */}
            <div className="absolute inset-0 overflow-hidden" style={{ left: `${pos}%` }}>
              <img
                src="/img/detection-showcase.webp"
                alt="Annotated sonar detection"
                draggable={false}
                className="h-full object-cover"
                style={{ width: `${10000 / (100 - pos)}%`, maxWidth: 'none', marginLeft: `-${(pos / (100 - pos)) * 100}%` }}
              />
              {/* animated detection boxes */}
              {revealed &&
                boxes.map((b, i) => (
                  <motion.div
                    key={b.label}
                    initial={{ opacity: 0, scale: 1.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 + i * 0.28, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute"
                    style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
                  >
                    {/* soft target wash */}
                    <span
                      className="absolute inset-0 rounded-lg"
                      style={{ background: `${b.tone}14`, boxShadow: `inset 0 0 28px ${b.tone}26` }}
                    />
                    {/* corner brackets */}
                    {corners.map((corner) => (
                      <span
                        key={corner}
                        className={`absolute h-5 w-5 ${corner}`}
                        style={{ borderColor: b.tone, filter: `drop-shadow(0 0 6px ${b.tone})` }}
                      />
                    ))}
                    <motion.span
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 + i * 0.28 }}
                      className="absolute -top-8 left-0 whitespace-nowrap rounded-md px-2 py-1 font-mono text-[10px] font-bold text-[#03202b] shadow-lg"
                      style={{ background: b.tone }}
                    >
                      {b.label}
                    </motion.span>
                    <span className="absolute -right-1 -top-1 h-2 w-2 animate-ping rounded-full" style={{ background: b.tone }} />
                  </motion.div>
                ))}
            </div>
          </div>

            {/* divider */}
            <div className="absolute inset-y-0 z-10" style={{ left: `${pos}%` }}>
              <div className="absolute inset-y-0 -left-px w-0.5 bg-cyan-300 shadow-glow" />
              <div className="absolute top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cyan-300/50 bg-[#04121c]/90 text-cyan-300 shadow-glow backdrop-blur">
                <Icon name="chevron" className="h-5 w-5 -rotate-90" />
                <Icon name="chevron" className="h-5 w-5 rotate-90 -ml-3" />
              </div>
            </div>

            <div className="absolute left-4 top-4 z-10"><Badge tone="cyan">Raw sonar</Badge></div>
            <div className="absolute right-4 top-4 z-10"><Badge tone="teal">AI review overlay</Badge></div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ['Severity-ranked boxes', 'Every target carries a priority — high, medium, low — so crews triage at a glance.'],
              ['Confidence you can trust', 'Per-target confidence scores with an analyst correction loop that keeps the model honest.'],
              ['Zone masks included', 'Detection-zone masks ship with every scan for GIS and cleanup-route planning.'],
            ].map(([t, d]) => (
              <div key={t} className="glass rounded-2xl p-5">
                <p className="m-0 flex items-center gap-2 font-display text-sm font-bold text-slate-100">
                  <Icon name="check" className="h-4 w-4 text-teal-300" /> {t}
                </p>
                <p className="mb-0 mt-2 text-xs leading-5 text-slate-400">{d}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
