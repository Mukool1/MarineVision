import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getHistory, getStats } from '../../api/api'
import { Badge, EmptyState, Icon, Reveal, SonarRadar, SpringNumber } from '../ui'

const severityFor = (summary) =>
  summary?.severity_counts?.high ? 'High' : summary?.severity_counts?.medium ? 'Medium' : 'Low'

const severityTone = (severity) =>
  severity === 'High' ? 'rose' : severity === 'Medium' ? 'amber' : 'emerald'

function DateCell({ timestamp }) {
  const date = new Date(timestamp * 1000)
  return (
    <span>
      {date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })}
      <br />
      <span className="text-slate-500">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </span>
  )
}

function Metric({ value, label, detail, icon, spring = true }) {
  return (
    <article className="panel group relative overflow-hidden !p-5 transition duration-300 hover:-translate-y-1 hover:shadow-glow">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-cyan-400/10 blur-2xl transition group-hover:bg-cyan-400/25" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">{label}</p>
          <p className="mb-0 mt-2 font-display text-3xl font-extrabold leading-none text-slate-100">
            {spring ? <SpringNumber value={value} /> : value}
          </p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-cyan-400/10 text-cyan-300">
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
      <p className="relative mb-0 mt-3 text-[11px] text-slate-400">{detail}</p>
    </article>
  )
}

function ThreatBanner({ stats }) {
  const high = stats?.severity_counts?.high || 0
  const medium = stats?.severity_counts?.medium || 0
  const outlook = high ? 'Elevated' : medium ? 'Watch' : 'Clear'
  const tone = high ? 'text-rose-300' : medium ? 'text-amber-300' : 'text-emerald-300'
  const message = high
    ? `${high} high-priority detection${high === 1 ? '' : 's'} need${high === 1 ? 's' : ''} field review before the next survey window.`
    : medium
      ? 'Review medium-priority findings and plan a follow-up pass.'
      : 'No high or medium-priority signals in the archive right now.'
  return (
    <Reveal>
      <section className="glass relative mb-6 overflow-hidden rounded-3xl p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/[.07] via-transparent to-teal-400/[.05]" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="relative">
            <SonarRadar size={118} blips={high ? 7 : 5} />
            {high > 0 && (
              <span className="absolute inset-0 animate-ping-slow rounded-full border border-rose-400/40" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Threat outlook</p>
            <h2 className="m-0 font-display text-xl font-bold tracking-tight text-slate-100">
              {outlook} <span className={tone}>marine debris activity</span>
            </h2>
            <p className="mb-0 mt-2 max-w-2xl text-xs leading-6 text-slate-400">{message}</p>
          </div>
          <div className="flex gap-5 rounded-2xl border border-white/10 bg-white/[.03] px-5 py-4">
            <div>
              <p className="m-0 font-display text-2xl font-bold text-rose-300"><SpringNumber value={high} /></p>
              <p className="m-0 text-[9px] font-bold uppercase tracking-widest text-slate-500">High risk</p>
            </div>
            <div className="border-l border-white/10 pl-5">
              <p className="m-0 font-display text-2xl font-bold text-amber-300"><SpringNumber value={medium} /></p>
              <p className="m-0 text-[9px] font-bold uppercase tracking-widest text-slate-500">Needs review</p>
            </div>
            <div className="border-l border-white/10 pl-5">
              <p className="m-0 font-display text-2xl font-bold text-cyan-300"><SpringNumber value={stats?.total_debris_detected || 0} /></p>
              <p className="m-0 text-[9px] font-bold uppercase tracking-widest text-slate-500">Targets</p>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  )
}

export default function Dashboard({ refreshKey, onNewScan, onViewHistory, onOpenScan }) {
  const [stats, setStats] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getStats(), getHistory(4)])
      .then(([statsData, historyData]) => {
        setStats(statsData)
        setRows(historyData)
      })
      .catch(() => {
        setStats(null)
        setRows([])
      })
      .finally(() => setLoading(false))
  }, [refreshKey])

  const totalScans = stats?.total_scans || 0
  const totalDebris = stats?.total_debris_detected || 0
  const highSeverity = stats?.severity_counts?.high || 0

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="page-enter mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Operations</p>
          <h1 className="m-0 font-display text-3xl font-bold tracking-tight text-slate-100">Command deck</h1>
          <p className="mb-0 mt-2 text-sm text-slate-400">
            Live operational pulse of marine debris surveillance and verified incidents.
          </p>
        </div>
        <button className="action gap-2" onClick={onNewScan}>
          <Icon name="plus" className="h-3.5 w-3.5" />
          New Scan
        </button>
      </div>

      <div className="page-enter-delay grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric value={totalScans} label="Total scans" detail="Images processed across all sectors" icon="image" />
        <Metric value={totalDebris} label="Debris detected" detail="Plastic, ghost nets & flotsam" icon="alert" />
        <Metric value={totalScans ? '100%' : '—'} spring={false} label="Detection rate" detail="Successful scan-processing throughput" icon="pulse" />
        <Metric value={0} label="Verified incidents" detail="Confirmed for environmental cleanup" icon="check" />
      </div>

      <div className="page-enter-delay-2 mt-6">
        <ThreatBanner stats={stats} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(250px,.72fr)]">
        <Reveal className="min-w-0">
          <section className="panel overflow-hidden !p-0">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="m-0 font-display text-base font-bold text-slate-100">Recent scans</h2>
                <p className="mb-0 mt-1 text-[11px] text-slate-400">Latest surveillance uploads and detection outputs</p>
              </div>
              <button className="action-secondary px-2.5 py-1.5 text-[11px]" onClick={onViewHistory}>
                View all
              </button>
            </div>
            {loading ? (
              <p className="p-5 text-sm text-slate-400">Loading scan activity…</p>
            ) : rows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Thumbnail</th>
                      <th className="px-2 py-3">Scan ID</th>
                      <th className="px-2 py-3">Date</th>
                      <th className="px-2 py-3">Location</th>
                      <th className="px-2 py-3">Targets</th>
                      <th className="px-2 py-3">Confidence</th>
                      <th className="px-2 py-3">Severity</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const severity = severityFor(row.summary)
                      return (
                        <motion.tr
                          key={row.scan_id}
                          initial={{ opacity: 0, x: -14 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                          className="border-b border-white/10 text-[11px] text-slate-400 last:border-0 hover:bg-cyan-400/5"
                        >
                          <td className="px-4 py-3">
                            <img
                              className="h-9 w-12 rounded-lg border border-white/10 object-cover"
                              src={row.annotated_image_url}
                              alt="Scan thumbnail"
                            />
                          </td>
                          <td className="px-2 py-3 font-mono font-bold text-cyan-300">SCN-{row.scan_id.slice(0, 8)}</td>
                          <td className="whitespace-nowrap px-2 py-3">
                            <DateCell timestamp={row.timestamp} />
                          </td>
                          <td className="max-w-24 truncate px-2 py-3">{row.location || 'Unknown sector'}</td>
                          <td className="px-2 py-3">
                            {row.summary?.total_objects
                              ? `${row.summary.total_objects} target${row.summary.total_objects === 1 ? '' : 's'}`
                              : 'No targets'}
                          </td>
                          <td className="px-2 py-3 font-semibold text-slate-200">
                            {Math.round((row.summary?.avg_confidence || 0) * 100)}%
                          </td>
                          <td className="px-2 py-3">
                            <Badge tone={severityTone(severity)}>{severity}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              className="action-secondary whitespace-nowrap px-2 py-1 text-[10px]"
                              onClick={() => onOpenScan(row.scan_id)}
                            >
                              View
                            </button>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon="radar"
                title="No scans recorded yet"
                sub="Start a new scan to populate your operational dashboard."
                action={
                  <button className="action gap-2 text-xs" onClick={onNewScan}>
                    <Icon name="plus" className="h-3.5 w-3.5" /> Run first scan
                  </button>
                }
              />
            )}
          </section>
        </Reveal>

        <Reveal delay={0.1} className="min-w-0">
          <section className="panel !p-0">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div>
                <h2 className="m-0 font-display text-base font-bold text-slate-100">Recent incidents</h2>
                <p className="mb-0 mt-1 text-[11px] text-slate-400">Confirmed debris actions</p>
              </div>
              <button className="action-secondary px-2.5 py-1.5 text-[11px]" onClick={onViewHistory}>
                All reports
              </button>
            </div>
            <div className="m-4 rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
              <Icon name="check" className="mx-auto h-6 w-6 text-slate-500" />
              <p className="mb-0 mt-2 text-xs font-bold text-slate-100">No verified incidents</p>
              <p className="mb-0 mt-1 text-[11px] text-slate-400">Confirmed scan detections will appear here.</p>
            </div>
            <div className="border-t border-white/10 px-4 py-3 text-[11px] text-slate-400">
              <span className="font-bold text-rose-300"><SpringNumber value={highSeverity} /></span> high-priority
              detection{highSeverity === 1 ? '' : 's'} awaiting review
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  )
}
