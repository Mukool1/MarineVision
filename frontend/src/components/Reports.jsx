import { useEffect, useState } from 'react'
import { getHistory } from '../api/api'
import Icon from './Icon'

const readReports = () => {
  try { return JSON.parse(localStorage.getItem('marinevision_reports') || '[]') } catch { return [] }
}

const level = scan => scan?.summary?.severity_counts?.high ? 'High' : scan?.summary?.severity_counts?.medium ? 'Medium' : 'Low'

export default function Reports({ refreshKey }) {
  const [scans, setScans] = useState([])
  const [reports, setReports] = useState(readReports)
  const [selected, setSelected] = useState('')
  const [note, setNote] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => { getHistory(100).then(setScans).catch(() => setScans([])) }, [refreshKey])
  const persist = value => { setReports(value); localStorage.setItem('marinevision_reports', JSON.stringify(value)) }
  const create = () => {
    const scan = scans.find(item => item.scan_id === selected)
    if (!scan || reports.some(item => item.scanId === selected)) return
    persist([{ id: `INC-${String(Date.now()).slice(-6)}`, scanId: scan.scan_id, location: scan.location || 'Unspecified sector', level: level(scan), targets: scan.summary?.total_objects || 0, note: note || 'Detection reviewed for field response.', status: 'Open', created: new Date().toISOString() }, ...reports])
    setSelected(''); setNote('')
  }
  const visible = filter === 'All' ? reports : reports.filter(report => report.status === filter)

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="page-enter mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-3xl font-extrabold tracking-tight text-ink">Incident Reports</h1>
          <p className="mb-0 mt-2 text-sm text-muted">Turn reviewed detections into clear, actionable field records.</p>
        </div>
        <div className="flex rounded-xl border border-line p-1">
          {['All', 'Open', 'Resolved'].map(item => <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-1.5 text-[10px] font-bold ${filter === item ? 'bg-gradient-to-r from-teal-500 to-cyan-400 text-slate-950' : 'text-muted'}`}>{item}</button>)}
        </div>
      </div>
      <div className="page-enter-delay grid gap-5 xl:grid-cols-[.9fr_1.35fr]">
        <section className="panel">
          <p className="eyebrow">Create report</p>
          <h2 className="m-0 font-display text-lg font-bold text-ink">Escalate a scan finding</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Select a completed scan, add field context, and keep its response status in one place.</p>
          <label className="mt-5 block"><span className="field-label">Reviewed scan</span><select className="field-input" value={selected} onChange={event => setSelected(event.target.value)}><option value="">Choose a scan to report</option>{scans.filter(scan => (scan.summary?.total_objects || 0) > 0).map(scan => <option key={scan.scan_id} value={scan.scan_id}>{scan.location || 'Unknown sector'} · {scan.summary.total_objects} target(s) · {level(scan)}</option>)}</select></label>
          <label className="mt-3 block"><span className="field-label">Response note</span><textarea className="field-input min-h-24 resize-y" value={note} onChange={event => setNote(event.target.value)} placeholder="e.g. Notify the local cleanup crew before the next tide." /></label>
          <button onClick={create} disabled={!selected || reports.some(item => item.scanId === selected)} className="action mt-5 w-full gap-2"><Icon name="report" className="h-4 w-4" />Create incident report</button>
          <p className="mb-0 mt-3 text-[10px] text-muted">Reports are saved to this browser and remain available after refresh.</p>
        </section>
        <section className="panel overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="m-0 text-sm font-bold text-ink">Response queue</h2>
              <p className="mb-0 mt-1 text-[10px] text-muted">{visible.length} {filter.toLowerCase()} report{visible.length === 1 ? '' : 's'}</p>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400/10 text-cyan"><Icon name="report" className="h-4 w-4" /></span>
          </div>
          {visible.length ? (
            <div className="divide-y divide-[var(--line)]">
              {visible.map(report => (
                <article key={report.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="m-0 font-mono text-[10px] font-bold text-cyan">{report.id}</p>
                      <h3 className="mb-0 mt-1 text-sm font-bold text-ink">{report.location}</h3>
                    </div>
                    <div className="flex gap-2">
                      <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${report.level === 'High' ? 'bg-rose-400/15 text-rose-300' : report.level === 'Medium' ? 'bg-amber-400/15 text-amber-300' : 'bg-emerald-400/15 text-emerald-300'}`}>{report.level} priority</span>
                      <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${report.status === 'Resolved' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-cyan-400/15 text-cyan'}`}>{report.status}</span>
                    </div>
                  </div>
                  <p className="mb-0 mt-3 text-xs leading-5 text-muted">{report.note}</p>
                  <div className="mt-4 flex items-center justify-between text-[10px] text-muted">
                    <span>{report.targets} detected target{report.targets === 1 ? '' : 's'} · {new Date(report.created).toLocaleDateString()}</span>
                    <button onClick={() => persist(reports.map(item => item.id === report.id ? { ...item, status: item.status === 'Open' ? 'Resolved' : 'Open' } : item))} className="font-bold text-cyan">Mark {report.status === 'Open' ? 'resolved' : 'open'}</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid min-h-80 place-items-center p-6 text-center">
              <div>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/10 text-muted"><Icon name="report" className="h-6 w-6" /></div>
                <p className="mb-0 mt-3 text-sm font-bold text-ink">No {filter.toLowerCase()} reports</p>
                <p className="mb-0 mt-1 text-xs text-muted">Use the review form to create a field-ready incident record.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
