import { useEffect, useState } from 'react'
import { getHistory, getStats } from '../api/api'
import Icon from './Icon'

const Metric = ({ value, label, detail, tone, icon }) => (
  <article className={`rounded-xl border border-slate-200 border-l-[3px] bg-white p-4 shadow-sm ${tone}`}>
    <div className="flex items-start justify-between gap-3">
      <div><p className="m-0 text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mb-0 mt-1 text-2xl font-bold leading-none text-[#073654]">{value}</p></div>
      <span className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-[#126287]"><Icon name={icon} className="h-5 w-5" /></span>
    </div>
    <p className="mb-0 mt-2 text-[10px] text-slate-500">{detail}</p>
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

  return <div className="mx-auto max-w-[1080px]">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="m-0 text-2xl font-bold tracking-tight text-[#073654]">Dashboard Overview</h1><p className="mb-0 mt-1 text-xs text-slate-500">Operational summary of marine debris surveillance scans and verified incidents.</p></div>
      <button className="action gap-2 bg-[#075987] px-4 py-2 text-xs hover:bg-[#064b73]" onClick={onNewScan}><Icon name="plus" className="h-3.5 w-3.5" />New Scan</button>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric value={totalScans} label="Total scans" detail="Images processed across all sectors" tone="border-l-[#075987]" icon="image" />
      <Metric value={totalDebris} label="Total debris detected" detail="Plastic, ghost nets & flotsam" tone="border-l-[#f2a523]" icon="alert" />
      <Metric value={totalScans ? '100%' : '—'} label="Detection rate" detail="Successful scan-processing throughput" tone="border-l-[#277a9b]" icon="pulse" />
      <Metric value={0} label="Verified incidents" detail="Confirmed for environmental cleanup" tone="border-l-[#3eb394]" icon="check" />
    </div>

    <section className="mt-5 rounded-xl bg-gradient-to-r from-[#023554] to-[#075b8a] px-6 py-5 text-white shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="m-0 text-base font-bold">Initiate Marine Image Surveillance Scan</h2><p className="mb-0 mt-1 max-w-2xl text-xs leading-5 text-sky-100">Upload surface, aerial, or side-scan sonar imagery to run debris detection. Review target boxes and submit verified incident reports.</p></div><button className="inline-flex items-center gap-2 rounded-lg bg-[#2e88b1] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#46a1ca]" onClick={onNewScan}><Icon name="plus" className="h-3.5 w-3.5" />Start New Scan</button></div>
    </section>

    <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(250px,.72fr)]">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4"><div><h2 className="m-0 text-sm font-bold text-[#073654]">Recent Scans</h2><p className="mb-0 mt-1 text-[10px] text-slate-500">Latest surveillance uploads and detection outputs</p></div><button className="action-secondary border-slate-200 px-2.5 py-1.5 text-[10px]" onClick={onViewHistory}>View All Scans</button></div>
        {loading ? <p className="p-5 text-xs text-slate-500">Loading scan activity…</p> : rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[670px] text-left"><thead className="border-b border-slate-200 bg-slate-50 text-[9px] font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Scan ID</th><th className="px-2 py-3">Thumbnail</th><th className="px-2 py-3">Date</th><th className="px-2 py-3">Location</th><th className="px-2 py-3">Detected Objects</th><th className="px-2 py-3">Confidence</th><th className="px-2 py-3">Severity</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{rows.map(row => { const severity = severityFor(row.summary); return <tr key={row.scan_id} className="border-b border-slate-100 text-[10px] text-slate-600 last:border-0"><td className="px-4 py-3 font-mono font-bold text-[#075987]">SCN-<br />{row.scan_id.slice(0, 8)}</td><td className="px-2 py-3"><img className="h-8 w-11 rounded object-cover" src={row.annotated_image_url} alt="Scan thumbnail" /></td><td className="px-2 py-3 whitespace-nowrap"><DateCell timestamp={row.timestamp} /></td><td className="max-w-24 truncate px-2 py-3">{row.location || 'Unknown sector'}</td><td className="max-w-28 px-2 py-3">{row.summary?.total_objects ? `${row.summary.total_objects} target${row.summary.total_objects === 1 ? '' : 's'}` : 'No targets'}</td><td className="px-2 py-3 font-semibold">{Math.round((row.summary?.avg_confidence || 0) * 100)}%</td><td className="px-2 py-3"><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${severity === 'High' ? 'bg-orange-100 text-orange-700' : severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{severity}</span></td><td className="px-4 py-3"><button className="action-secondary whitespace-nowrap border-slate-200 px-2 py-1 text-[9px]" onClick={() => onOpenScan(row.scan_id)}>View Result</button></td></tr> })}</tbody></table></div> : <div className="p-10 text-center"><p className="m-0 text-xs font-semibold text-[#073654]">No scans recorded yet</p><p className="mb-0 mt-1 text-[10px] text-slate-500">Start a new scan to populate your operational dashboard.</p></div>}
      </section>
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-4"><div><h2 className="m-0 text-sm font-bold text-[#073654]">Recent Incidents</h2><p className="mb-0 mt-1 text-[10px] text-slate-500">Confirmed debris actions</p></div><button className="action-secondary border-slate-200 px-2.5 py-1.5 text-[10px]" onClick={onViewHistory}>All Reports</button></div><div className="m-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center"><Icon name="check" className="mx-auto h-5 w-5 text-slate-400" /><p className="mb-0 mt-2 text-[10px] font-bold text-[#31506a]">No Verified Incidents</p><p className="mb-0 mt-1 text-[9px] text-slate-500">Confirmed scan detections will appear here.</p></div><div className="border-t border-slate-100 px-4 py-3 text-[10px] text-slate-500"><span className="font-semibold text-orange-700">{highSeverity}</span> high-priority detection{highSeverity === 1 ? '' : 's'} awaiting review</div></section>
    </div>
  </div>
}
