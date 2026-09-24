import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Icon, Reveal, SectionHeader } from '../ui'

const cards = [
  {
    icon: 'radar', span: 'lg:col-span-2',
    title: 'Sonar-native detection core',
    text: 'Trained on side-scan and sonar-style imagery, the YOLO core separates debris, ghost nets, wreckage and natural anomalies — even in low-contrast, noisy frames where generic detectors go blind.',
    visual: 'sonar',
  },
  {
    icon: 'spark', span: '',
    title: 'AI field analyst',
    text: 'A Gemini-powered assistant reads every scan, summarizes severity, and answers operator questions in plain language.',
  },
  {
    icon: 'shield', span: '',
    title: 'Hazard & wreck registry',
    text: 'Wrecks, pipelines and mines are classified separately from litter — so archaeology and danger never get mixed up.',
  },
  {
    icon: 'report', span: '',
    title: 'Incident reports',
    text: 'One click turns a reviewed scan into a field-ready record with location, depth, targets and response notes.',
  },
  {
    icon: 'analytics', span: 'lg:col-span-2',
    title: 'Survey analytics',
    text: 'Debris trends over time, category breakdowns, severity distribution and pipeline throughput — the full telemetry of your monitoring operation, rendered live.',
    visual: 'chart',
  },
  {
    icon: 'users', span: '',
    title: 'Analyst feedback loop',
    text: 'Correct any label, priority or decision. Corrections are stored with the scan and redrawn instantly.',
  },
]

function TiltCard({ card, index }) {
  const ref = useRef(null)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 180, damping: 22 })
  const ry = useSpring(useTransform(mx, [0, 1], [-7, 7]), { stiffness: 180, damping: 22 })

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width)
    my.set((e.clientY - r.top) / r.height)
  }
  const onLeave = () => { mx.set(0.5); my.set(0.5) }

  return (
    <Reveal delay={(index % 3) * 0.1} className={card.span}>
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
        className="glass group relative h-full overflow-hidden rounded-[1.75rem] p-7 transition-shadow duration-300 hover:shadow-glow-lg"
      >
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl transition group-hover:bg-cyan-400/20" />
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-400/10 text-cyan-300">
          <Icon name={card.icon} className="h-5 w-5" />
        </span>
        <h3 className="m-0 mt-5 font-display text-xl font-bold text-slate-100">{card.title}</h3>
        <p className="mb-0 mt-2.5 text-sm leading-6 text-slate-400">{card.text}</p>

        {card.visual === 'sonar' && (
          <div className="mt-6 flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <div className="absolute inset-0 rounded-full border border-cyan-300/30" />
              <div className="absolute inset-3 rounded-full border border-cyan-300/20" />
              <div className="absolute inset-0"><div className="ring-conic h-full w-full animate-sweep" /></div>
              <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300" />
              <span className="absolute right-3 top-4 h-1.5 w-1.5 animate-blink rounded-full bg-rose-400" />
              <span className="absolute bottom-4 left-5 h-1.5 w-1.5 animate-blink rounded-full bg-amber-300 [animation-delay:600ms]" />
            </div>
            <div className="flex flex-wrap gap-2">
              {['Plastic 93%', 'Ghost net 88%', 'Wreck 96%'].map((t) => (
                <span key={t} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 font-mono text-[10px] text-slate-300">{t}</span>
              ))}
            </div>
          </div>
        )}
        {card.visual === 'chart' && (
          <div className="mt-6 flex h-24 items-end gap-2">
            {[38, 62, 45, 78, 56, 90, 70, 100, 64, 84, 52, 74].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 rounded-t-md bg-gradient-to-t from-cyan-500/20 to-cyan-300/80"
              />
            ))}
          </div>
        )}
      </motion.div>
    </Reveal>
  )
}

export default function Features() {
  return (
    <section id="platform" className="relative py-28 sm:py-36">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-500/[.06] blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeader
          eyebrow="The platform"
          title={<>Everything a survey team needs, <span className="text-gradient">in one current</span></>}
          sub="Detection is only the beginning. MarineVision wraps the model in the full operational workflow — from intake to incident response."
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <TiltCard key={c.title} card={c} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
