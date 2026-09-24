import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Icon } from '../ui'

const zones = [
  {
    range: [0, 0.33],
    depth: '0 – 200 m',
    name: 'Sunlight zone',
    text: 'Surveys begin at the surface — coastal transects where floating plastics and runoff debris first enter the system.',
    icon: 'wave',
    tone: 'text-cyan-300',
  },
  {
    range: [0.33, 0.66],
    depth: '200 – 1,000 m',
    name: 'The debris field',
    text: 'Ghost nets, tires, barrels and shattered containers settle here. MarineVision flags every anomaly with a severity-ranked box.',
    icon: 'radar',
    tone: 'text-amber-300',
  },
  {
    range: [0.66, 1.01],
    depth: '1,000 – 4,000 m',
    name: 'The abyssal plain',
    text: 'Shipwrecks and deep hazards rest in darkness for decades. Our models keep watching where human eyes never reach.',
    icon: 'anchor',
    tone: 'text-violet-300',
  },
]

function ZoneCard({ zone, progress }) {
  const [start, end] = zone.range
  const opacity = useTransform(progress, [start, start + 0.06, end - 0.08, end], [0, 1, 1, 0])
  const y = useTransform(progress, [start, end], [70, -70])
  return (
    <motion.div style={{ opacity, y }} className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
      <div className="glass mx-auto w-fit max-w-md rounded-[2rem] p-8 text-center shadow-glow-lg">
        <span className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 ${zone.tone}`}>
          <Icon name={zone.icon} className="h-6 w-6" />
        </span>
        <p className="eyebrow mt-5">{zone.depth}</p>
        <h3 className="m-0 font-display text-3xl font-bold text-slate-100">{zone.name}</h3>
        <p className="mb-0 mt-3 text-sm leading-6 text-slate-400">{zone.text}</p>
      </div>
    </motion.div>
  )
}

export default function DepthDive() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const depth = useTransform(scrollYProgress, [0, 1], [0, 4000])
  const depthText = useTransform(depth, (v) => `${Math.round(v).toLocaleString()} m`)
  const bgY = useTransform(scrollYProgress, [0, 1], ['-12%', '12%'])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.15, 1.35])
  const darkness = useTransform(scrollYProgress, [0, 0.5, 1], [0.25, 0.55, 0.8])
  const gaugeY = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  const introOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0])

  return (
    <section id="descent" ref={ref} className="relative h-[420vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        {/* parallax abyss backdrop */}
        <motion.div style={{ y: bgY, scale: bgScale }} className="absolute inset-0">
          <img src="/img/abyss-descent.webp" alt="" className="h-full w-full object-cover" />
        </motion.div>
        <motion.div style={{ opacity: darkness }} className="absolute inset-0 bg-[#02070c]" />
        <div className="vignette absolute inset-0" />

        {/* intro label */}
        <motion.div style={{ opacity: introOpacity }} className="absolute inset-x-0 top-24 z-10 text-center">
          <p className="eyebrow">Scroll to descend</p>
          <h2 className="m-0 font-display text-4xl font-bold text-slate-100 sm:text-5xl">
            One scroll. <span className="text-gradient">4,000 metres down.</span>
          </h2>
        </motion.div>

        {/* zone cards */}
        {zones.map((z) => (
          <ZoneCard key={z.name} zone={z} progress={scrollYProgress} />
        ))}

        {/* depth gauge */}
        <div className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-3 sm:flex md:right-12">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Surface</span>
          <div className="relative h-64 w-1 overflow-hidden rounded-full bg-white/10">
            <motion.div style={{ top: gaugeY }} className="absolute left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-cyan-300 shadow-glow" />
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-300/60 via-teal-400/30 to-violet-400/60" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Abyss</span>
          <motion.p className="m-0 font-display text-2xl font-bold text-cyan-200">{depthText}</motion.p>
        </div>

        {/* mobile depth readout */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 sm:hidden">
          <motion.p className="glass m-0 rounded-full px-5 py-2 font-display text-lg font-bold text-cyan-200">{depthText}</motion.p>
        </div>
      </div>
    </section>
  )
}
