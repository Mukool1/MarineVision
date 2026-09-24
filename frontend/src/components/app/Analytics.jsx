import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getStats } from '../../api/api'
import { EmptyState, Icon, Reveal } from '../ui'

const colors = ['#22d3ee', '#2dd4bf', '#67e8f9', '#818cf8', '#fbbf24', '#fb7185']
const tip = {
  contentStyle: {
    background: '#071c2a',
    border: '1px solid rgba(148,196,216,0.22)',
    borderRadius: 12,
    fontSize: 11,
    color: '#e8f4f8',
  },
}
const gridStroke = 'rgba(148,196,216,0.12)'
const tickFill = '#8fa9b8'

const Card = ({ title, subtitle, children }) => (
  <section className="panel min-h-[300px]">
    <h2 className="m-0 font-display text-sm font-bold text-slate-100">{title}</h2>
    <p className="mb-0 mt-1 text-[10px] text-slate-400">{subtitle}</p>
    <div className="mt-3 h-[228px]">{children}</div>
  </section>
)

export default function Analytics({ refreshKey }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getStats().then(setStats).catch(() => setStats(null)).finally(() => setLoading(false))
  }, [refreshKey])

  const severity = ['low', 'medium', 'high'].map((key) => ({
    name: key[0].toUpperCase() + key.slice(1),
    value: stats?.severity_counts?.[key] || 0,
  }))
  const high = severity[2].value
  const medium = severity[1].value
  const targets = stats?.total_debris_detected || 0
  const outlook = high ? 'Elevated' : medium ? 'Watch' : targets ? 'Low' : 'Clear'
  const outlookTone = high ? 'text-rose-300' : medium ? 'text-amber-300' : targets ? 'text-cyan-300' : 'text-emerald-300'
  const message = high
    ? 'High-priority detections need field review before the next survey window.'
    : medium
      ? 'Review medium-priority findings and plan a follow-up pass.'
      : targets
        ? 'Detections recorded with no high-priority signals.'
        : 'No debris signals have been recorded yet.'
  const trend = Object.entries(
    (stats?.timeline || []).reduce((a, x) => {
      const k = new Date(x.timestamp * 1000).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })
      a[k] = (a[k] || 0) + (x.debris_count || 0)
      return a
    }, {})
  ).map(([date, detections]) => ({ date, detections }))
  const categories = Object.entries(stats?.label_counts || {}).map(([label, value]) => ({
    name: label.replace(/^(Debris|Natural|Anomaly)\s*-\s*/i, ''),
    value,
  }))
  const pipeline = [
    { name: 'Total scans', value: stats?.total_scans || 0, fill: '#22d3ee' },
    { name: 'Completed', value: stats?.total_scans || 0, fill: '#2dd4bf' },
    { name: 'High priority', value: high, fill: '#fb7185' },
    { name: 'Needs review', value: medium, fill: '#fbbf24' },
  ]

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="page-enter mb-6">
        <p className="eyebrow">Telemetry</p>
        <h1 className="m-0 font-display text-3xl font-bold tracking-tight text-slate-100">Monitoring analytics</h1>
        <p className="mb-0 mt-2 text-sm text-slate-400">
          Telemetry metrics, debris category trends, and severity distribution from processed scans.
        </p>
      </div>

      {loading ? (
        <div className="panel text-sm text-slate-400">Loading monitoring analytics…</div>
      ) : (
        <div className="page-enter-delay">
          <Reveal>
            <section className="glass relative mb-4 overflow-hidden rounded-3xl p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/[.07] via-transparent to-teal-400/[.05]" />
              <div className="relative flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-400 text-[#03202b]">
                    <Icon name="alert" className="h-5 w-5" />
                    {high > 0 && (
                      <span className="absolute inset-0 animate-ping-slow rounded-2xl border border-rose-400/50" aria-hidden="true" />
                    )}
                  </span>
                  <div>
                    <p className="m-0 text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">
                      Current threat outlook
                    </p>
                    <h2 className="mb-0 mt-1 font-display text-lg font-bold text-slate-100">
                      {outlook} <span className={outlookTone}>marine debris activity</span>
                    </h2>
                    <p className="mb-0 mt-1 text-xs text-slate-400">{message}</p>
                  </div>
                </div>
                <div className="flex gap-5 rounded-2xl border border-white/10 bg-white/[.03] px-4 py-3">
                  <ThreatStat value={high} label="High risk" tone="text-rose-300" />
                  <ThreatStat value={medium} label="Needs review" tone="text-amber-300" border />
                  <ThreatStat value={targets} label="Targets" tone="text-cyan-300" border />
                </div>
              </div>
            </section>
          </Reveal>

          <div className="grid gap-4 lg:grid-cols-2">
            <Reveal>
              <Card title="Detection trend" subtitle="Debris objects detected over time">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 12, right: 8, left: -20, bottom: 4 }}>
                    <CartesianGrid vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: tickFill }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                    <Tooltip {...tip} />
                    <Line type="monotone" dataKey="detections" name="Detections" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Reveal>
            <Reveal delay={0.08}>
              <Card title="Debris categories" subtitle="Distribution by debris classification">
                {categories.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categories} dataKey="value" nameKey="name" innerRadius={63} outerRadius={96}>
                        {categories.map((item, index) => (
                          <Cell key={item.name} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip {...tip} />
                      <Legend wrapperStyle={{ fontSize: 10, color: tickFill }} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon="layers" title="No category data yet" sub="Process a scan to see debris categories." />
                )}
              </Card>
            </Reveal>
            <Reveal>
              <Card title="Severity distribution" subtitle="Scans by hazard severity class">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={severity}>
                    <CartesianGrid vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: tickFill }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                    <Tooltip {...tip} />
                    <Bar dataKey="value" name="Scans" radius={[4, 4, 0, 0]}>
                      {severity.map((item, index) => (
                        <Cell key={item.name} fill={['#67e8f9', '#fbbf24', '#fb7185'][index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Reveal>
            <Reveal delay={0.08}>
              <Card title="Scan statistics" subtitle="Pipeline activity and review status">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipeline} layout="vertical" margin={{ left: 35 }}>
                    <CartesianGrid horizontal={false} stroke={gridStroke} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} width={72} />
                    <Tooltip {...tip} />
                    <Bar dataKey="value" name="Scans" radius={[0, 4, 4, 0]}>
                      {pipeline.map((item) => (
                        <Cell key={item.name} fill={item.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Reveal>
          </div>
        </div>
      )}
    </div>
  )
}

function ThreatStat({ value, label, tone, border }) {
  return (
    <div className={border ? 'border-l border-white/10 pl-5' : ''}>
      <p className={`m-0 font-display text-xl font-bold ${tone}`}>{value}</p>
      <p className="m-0 text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
    </div>
  )
}
