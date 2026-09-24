import { CountUp, Icon, Reveal } from '../ui'

const stats = [
  { icon: 'image', value: 1200, suffix: '+', label: 'Sonar frames processed', sub: 'Across coastal survey sectors' },
  { icon: 'radar', value: 98, suffix: '%', label: 'Detection precision', sub: 'On held-out validation frames' },
  { icon: 'zap', value: 38, suffix: 's', label: 'Median pipeline time', sub: 'Upload to annotated review' },
  { icon: 'shield', value: 24, suffix: '/7', label: 'Hazard watch', sub: 'Wreckage & anomaly monitoring' },
]

export default function Stats() {
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-[#041420]/90 py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(34,211,238,.09),transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1} className="text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-400/10 text-cyan-300">
                <Icon name={s.icon} className="h-5 w-5" />
              </span>
              <p className="m-0 mt-4 font-display text-5xl font-bold tracking-tight text-white">
                <CountUp to={s.value} suffix={s.suffix} />
              </p>
              <p className="m-0 mt-2 text-sm font-bold text-slate-200">{s.label}</p>
              <p className="m-0 mt-1 text-xs text-slate-500">{s.sub}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
