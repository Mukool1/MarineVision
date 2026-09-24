import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Icon, Reveal, SectionHeader } from '../ui'

const steps = [
  {
    n: '01',
    icon: 'upload',
    title: 'Drop in a sonar frame',
    text: 'Upload side-scan imagery with survey context — location, transect, depth. The intake pipeline enhances and normalizes every frame in seconds.',
    tag: 'Intake',
  },
  {
    n: '02',
    icon: 'radar',
    title: 'AI maps every target',
    text: 'A YOLO detection core scans the seabed for debris, ghost nets, wreckage and structural anomalies — drawing severity-ranked bounding boxes with confidence scores.',
    tag: 'Detect',
  },
  {
    n: '03',
    icon: 'send',
    title: 'Act with intelligence',
    text: 'Correct findings in the analyst loop, ask the AI assistant what it all means, and escalate verified hits into incident reports for cleanup crews.',
    tag: 'Respond',
  },
]

function StepCard({ step, i }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [60, -60])
  return (
    <div ref={ref} className="relative">
      <motion.div style={{ y }} className="glass grain relative h-full overflow-hidden rounded-[2rem] p-8 shadow-card">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="flex items-start justify-between">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-[#03202b] shadow-glow">
            <Icon name={step.icon} className="h-6 w-6" />
          </span>
          <span className="font-display text-5xl font-bold text-white/[.07]">{step.n}</span>
        </div>
        <p className="eyebrow mt-6">{step.tag}</p>
        <h3 className="m-0 font-display text-2xl font-bold text-slate-100">{step.title}</h3>
        <p className="mb-0 mt-3 text-sm leading-6 text-slate-400">{step.text}</p>
        {i < steps.length - 1 && (
          <div className="absolute right-[-2.5rem] top-1/2 hidden -translate-y-1/2 text-cyan-300/40 lg:block">
            <Icon name="arrow" className="h-8 w-8" />
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function HowItWorks() {
  return (
    <section id="how" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeader
          eyebrow="The pipeline"
          title={<>From raw ping to <span className="text-gradient">field-ready action</span></>}
          sub="Three movements. Every scan flows through the same intelligent pipeline — built for speed at sea and clarity on shore."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.12}>
              <StepCard step={s} i={i} />
            </Reveal>
          ))}
        </div>

        {/* connector line */}
        <Reveal delay={0.2}>
          <div className="mt-12 flex items-center justify-center gap-4 text-slate-500">
            <span className="h-px w-24 bg-gradient-to-r from-transparent to-cyan-400/50" />
            <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.2em]">
              <Icon name="zap" className="h-3.5 w-3.5 text-cyan-300" /> Median pipeline time: 38 seconds
            </span>
            <span className="h-px w-24 bg-gradient-to-l from-transparent to-cyan-400/50" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
