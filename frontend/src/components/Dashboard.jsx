import { useEffect, useState } from 'react'
import { getHistory, getStats } from '../api/api'
import Icon from './Icon'

const Metric = ({ value, label, detail, icon }) => (
  <article className="panel group relative overflow-hidden p-5 transition hover:-translate-y-1 hover:shadow-glow">
    <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-cyan-400/10 blur-2xl transition group-hover:bg-cyan-400/25" />
    <div className="relative flex items-start justify-between gap-3">
      <div>
        <p className="m-0 text-[10px] font-bold uppercase tracking-[.16em] text-muted">{label}</p>
        <p className="mb-0 mt-2 font-display text-3xl font-extrabold leading-none text-ink">{value}</p>
      </div>
      <span className="grid h-11 w-11 place-items-center rounded-2xl border border-line bg-cyan-400/10 text-cyan"><Icon name={icon} className="h-5 w-5" /></span>
    </div>
    <p className="relative mb-0 mt-3 text-[11px] text-muted">{detail}</p>
  </article>
)

const severityFor = summary => summary?.severity_counts?.high ? 'High' : summary?.severity_counts?.medium ? 'Medium' : 'Low'

function DateCell({ timestamp }) {
  const date = new Date(timestamp * 1000)
  return <span>{date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })}<br />{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
}

export default function Dashboard({ refreshKey, onNewScan, onViewHistory, onOpenScan }) {
  const [stats, setStats] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getStats(), getHistory(4)])
      .then(([statsData, historyData]) => { setStats(statsData); setRows(historyData) })
      .catch(() => { setStats(null); setRows([]) })
      .finally(() => setLoading(false))
  }, [refreshKey])

  const totalScans = stats?.total_scans || 0
  const totalDebris = stats?.total_debris_detected || 0
  const highSeverity = stats?.severity_counts?.high || 0

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="page-enter mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-3xl font-extrabold tracking-tight text-ink">Command deck</h1>
          <p className="mb-0 mt-2 text-sm text-muted">Live operational pulse of marine debris surveillance and verified incidents.</p>
        </div>
        <button className="action gap-2" onClick={onNewScan}><Icon name="plus" className="h-3.5 w-3.5" />New Scan</button>
      </div>

      <div className="page-enter-delay grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric value={totalScans} label="Total scans" detail="Images processed across all sectors" icon="image" />
        <Metric value={totalDebris} label="Debris detected" detail="Plastic, ghost nets & flotsam" icon="alert" />
        <Metric value={totalScans ? '100%' : '—'} label="Detection rate" detail="Successful scan-processing throughput" icon="pulse" />
        <Metric value={0} label="Verified incidents" detail="Confirmed for environmental cleanup" icon="check" />
      </div>

      <section className="page-enter-delay relative mt-6 overflow-hidden rounded-3xl border border-cyan-200/20 bg-gradient-to-r from-[#023554] via-[#0b5f7a] to-teal-600 px-6 py-6 text-white shadow-glow">
        <div className="absolute right-8 top-4 h-24 w-24 animate-float rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="m-0 font-display text-xl font-bold">Initiate a surveillance scan</h2>
            <p className="mb-0 mt-2 max-w-2xl text-sm leading-6 text-cyan-50/80">Upload surface, aerial, or side-scan sonar imagery. Then ask the AI assistant what the detections mean for cleanup.</p>
          </div>
          <button className="action" onClick={onNewScan}><Icon name="plus" className="h-3.5 w-3.5" />Start New Scan</button>
        </div>
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(250px,.72fr)]">
        <section className="panel overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="m-0 text-base font-bold text-ink">Recent Scans</h2>
              <p className="mb-0 mt-1 text-[11px] text-muted">Latest surveillance uploads and detection outputs</p>
            </div>
            <button className="action-secondary px-2.5 py-1.5 text-[11px]" onClick={onViewHistory}>View all</button>
          </div>
          {loading ? <p className="p-5 text-sm text-muted">Loading scan activity…</p> : rows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[670px] text-left">
                <thead className="border-b border-line text-[10px] font-bold uppercase tracking-wide text-muted">
                  <tr><th className="px-4 py-3">Scan ID</th><th className="px-2 py-3">Thumbnail</th><th className="px-2 py-3">Date</th><th className="px-2 py-3">Location</th><th className="px-2 py-3">Detected</th><th className="px-2 py-3">Confidence</th><th className="px-2 py-3">Severity</th><th className="px-4 py-3">Action</th></tr>
                </thead>
                <tbody>
                  {rows.map(row => {
                    const severity = severityFor(row.summary)
                    return (
                      <tr key={row.scan_id} className="border-b border-line text-[11px] text-muted last:border-0">
                        <td className="px-4 py-3 font-mono font-bold text-cyan">SCN-{row.scan_id.slice(0, 8)}</td>
                        <td className="px-2 py-3"><img className="h-9 w-12 rounded-lg object-cover" src={row.annotated_image_url} alt="Scan thumbnail" /></td>
                        <td className="whitespace-nowrap px-2 py-3"><DateCell timestamp={row.timestamp} /></td>
                        <td className="max-w-24 truncate px-2 py-3">{row.location || 'Unknown sector'}</td>
                        <td className="px-2 py-3">{row.summary?.total_objects ? `${row.summary.total_objects} target${row.summary.total_objects === 1 ? '' : 's'}` : 'No targets'}</td>
                        <td className="px-2 py-3 font-semibold">{Math.round((row.summary?.avg_confidence || 0) * 100)}%</td>
                        <td className="px-2 py-3"><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${severity === 'High' ? 'bg-orange-400/20 text-orange-300' : severity === 'Medium' ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-400/20 text-emerald-300'}`}>{severity}</span></td>
                        <td className="px-4 py-3"><button className="action-secondary whitespace-nowrap px-2 py-1 text-[10px]" onClick={() => onOpenScan(row.scan_id)}>View</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="m-0 text-sm font-semibold text-ink">No scans recorded yet</p>
              <p className="mb-0 mt-1 text-xs text-muted">Start a new scan to populate your operational dashboard.</p>
            </div>
          )}
        </section>
        <section className="panel p-0">
          <div className="flex items-center justify-between border-b border-line px-4 py-4">
            <div>
              <h2 className="m-0 text-base font-bold text-ink">Recent incidents</h2>
              <p className="mb-0 mt-1 text-[11px] text-muted">Confirmed debris actions</p>
            </div>
            <button className="action-secondary px-2.5 py-1.5 text-[11px]" onClick={onViewHistory}>All reports</button>
          </div>
          <div className="m-4 rounded-2xl border border-dashed border-line px-4 py-8 text-center">
            <Icon name="check" className="mx-auto h-6 w-6 text-muted" />
            <p className="mb-0 mt-2 text-xs font-bold text-ink">No verified incidents</p>
            <p className="mb-0 mt-1 text-[11px] text-muted">Confirmed scan detections will appear here.</p>
          </div>
          <div className="border-t border-line px-4 py-3 text-[11px] text-muted">
            <span className="font-semibold text-coral">{highSeverity}</span> high-priority detection{highSeverity === 1 ? '' : 's'} awaiting review
          </div>
        </section>
      </div>
    </div>
  )
}
