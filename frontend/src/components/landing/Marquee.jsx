import { Icon } from '../ui'

const items = [
  'Side-scan sonar intake',
  'YOLOv8 detection core',
  'Ghost-net mapping',
  'Wreck & hazard alerts',
  'AI field analyst',
  'Incident reports',
  'Survey analytics',
  'Analyst feedback loop',
]

export default function Marquee() {
  const row = [...items, ...items]
  return (
    <div className="relative border-y border-white/10 bg-[#04121c]/80 py-5 backdrop-blur">
      <div className="mask-fade-x overflow-hidden">
        <div className="flex w-max animate-marquee gap-4">
          {row.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-3 whitespace-nowrap rounded-full border border-white/10 bg-white/[.03] px-5 py-2.5 text-xs font-bold uppercase tracking-[.18em] text-slate-300">
              <Icon name="spark" className="h-3.5 w-3.5 text-cyan-300" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
