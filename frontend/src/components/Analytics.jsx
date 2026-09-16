import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getStats } from '../api/api'
import Icon from './Icon'

const colors = ['#22d3ee', '#2dd4bf', '#67e8f9', '#818cf8', '#fbbf24', '#fb7185']
const tip = { contentStyle: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, fontSize: 11, color: 'var(--ink)' } }
const Card = ({ title, subtitle, children }) => (
  <section className="panel min-h-[300px]">
    <h2 className="m-0 font-display text-sm font-bold text-ink">{title}</h2>
    <p className="mb-0 mt-1 text-[10px] text-muted">{subtitle}</p>
    <div className="mt-3 h-[228px]">{children}</div>
  </section>
)

export default function Analytics({ refreshKey }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { setLoading(true); getStats().then(setStats).catch(() => setStats(null)).finally(() => setLoading(false)) }, [refreshKey])
  const severity = ['low', 'medium', 'high'].map(key => ({ name: key[0].toUpperCase() + key.slice(1), value: stats?.severity_counts?.[key] || 0 }))
  const high = severity[2].value, medium = severity[1].value, targets = stats?.total_debris_detected || 0
  const outlook = high ? 'Elevated' : medium ? 'Watch' : targets ? 'Low' : 'Clear'
  const message = high ? 'High-priority detections need field review before the next survey window.' : medium ? 'Review medium-priority findings and plan a follow-up pass.' : targets ? 'Detections recorded with no high-priority signals.' : 'No debris signals have been recorded yet.'
  const trend = Object.entries((stats?.timeline || []).reduce((a, x) => { const k = new Date(x.timestamp * 1000).toLocaleDateString(undefined, { month: 'short', day: '2-digit' }); a[k] = (a[k] || 0) + (x.debris_count || 0); return a }, {})).map(([date, detections]) => ({ date, detections }))
  const categories = Object.entries(stats?.label_counts || {}).map(([label, value]) => ({ name: label.replace(/^(Debris|Natural|Anomaly)\s*-\s*/i, ''), value }))
  const pipeline = [{ name: 'Total scans', value: stats?.total_scans || 0, fill: '#22d3ee' }, { name: 'Completed', value: stats?.total_scans || 0, fill: '#2dd4bf' }, { name: 'High priority', value: high, fill: '#fb7185' }, { name: 'Needs review', value: medium, fill: '#fbbf24' }]
  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="page-enter mb-6">
        <h1 className="m-0 text-3xl font-extrabold tracking-tight text-ink">Monitoring Analytics</h1>
        <p className="mb-0 mt-2 text-sm text-muted">Telemetry metrics, debris category trends, and severity distribution from processed scans.</p>
      </div>
      {loading ? <div className="panel text-sm text-muted">Loading monitoring analytics…</div> : (
        <div className="page-enter-delay">
          <Threat outlook={outlook} high={high} medium={medium} targets={targets} message={message} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Detection Trend" subtitle="Debris objects detected over time">
              <ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ top: 12, right: 8, left: -20, bottom: 4 }}><CartesianGrid vertical={false} stroke="var(--line)" /><XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip {...tip} /><Line type="monotone" dataKey="detections" name="Detections" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>
            </Card>
            <Card title="Debris Categories" subtitle="Distribution by debris classification">
              {categories.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="value" nameKey="name" innerRadius={63} outerRadius={96}>{categories.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip {...tip} /><Legend wrapperStyle={{ fontSize: 10 }} iconType="circle" /></PieChart></ResponsiveContainer> : <Empty text="Process a scan to see debris categories." />}
            </Card>
            <Card title="Severity Distribution" subtitle="Scans by hazard severity class">
              <ResponsiveContainer width="100%" height="100%"><BarChart data={severity}><CartesianGrid vertical={false} stroke="var(--line)" /><XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip {...tip} /><Bar dataKey="value" name="Scans" radius={[4, 4, 0, 0]}>{severity.map((item, index) => <Cell key={item.name} fill={['#67e8f9', '#fbbf24', '#fb7185'][index]} />)}</Bar></BarChart></ResponsiveContainer>
            </Card>
            <Card title="Scan Statistics" subtitle="Pipeline activity and review status">
              <ResponsiveContainer width="100%" height="100%"><BarChart data={pipeline} layout="vertical" margin={{ left: 35 }}><CartesianGrid horizontal={false} stroke="var(--line)" /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={72} /><Tooltip {...tip} /><Bar dataKey="value" name="Scans" radius={[0, 4, 4, 0]}>{pipeline.map(item => <Cell key={item.name} fill={item.fill} />)}</Bar></BarChart></ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function Threat({ outlook, high, medium, targets, message }) {
  return (
    <section className="panel mb-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-400 text-slate-950"><Icon name="alert" className="h-5 w-5" /></span>
          <div>
            <p className="m-0 text-[10px] font-bold uppercase tracking-[.15em] text-muted">Current threat outlook</p>
            <h2 className="mb-0 mt-1 font-display text-lg font-bold text-ink">{outlook} marine debris activity</h2>
            <p className="mb-0 mt-1 text-xs text-muted">{message}</p>
          </div>
        </div>
        <div className="flex gap-5 rounded-2xl border border-line px-4 py-3">
          <Stat value={high} label="High risk" tone="text-coral" />
          <Stat value={medium} label="Needs review" tone="text-amber-400" border />
          <Stat value={targets} label="Targets" tone="text-cyan" border />
        </div>
      </div>
    </section>
  )
}
function Stat({ value, label, tone, border }) { return <div className={border ? 'border-l border-line pl-5' : ''}><p className={`m-0 text-xl font-bold ${tone}`}>{value}</p><p className="m-0 text-[9px] font-bold uppercase tracking-wide text-muted">{label}</p></div> }
function Empty({ text }) { return <div className="grid h-full place-items-center text-center text-xs text-muted">{text}</div> }
