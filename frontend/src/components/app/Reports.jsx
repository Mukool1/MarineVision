import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getHistory } from '../../api/api'
import { Badge, EmptyState, Icon, Reveal } from '../ui'

const readReports = () => {
  try {
    return JSON.parse(localStorage.getItem('marinevision_reports') || '[]')
  } catch {
    return []
  }
}

const level = (scan) =>
  scan?.summary?.severity_counts?.high ? 'High' : scan?.summary?.severity_counts?.medium ? 'Medium' : 'Low'

const levelTone = (lvl) => (lvl === 'High' ? 'rose' : lvl === 'Medium' ? 'amber' : 'emerald')

export default function Reports({ refreshKey }) {
  const [scans, setScans] = useState([])
  const [reports, setReports] = useState(readReports)
  const [selected, setSelected] = useState('')
  const [note, setNote] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    getHistory(100).then(setScans).catch(() => setScans([]))
  }, [refreshKey])

  const persist = (value) => {
    setReports(value)
    localStorage.setItem('marinevision_reports', JSON.stringify(value))
  }

  const create = () => {
    const scan = scans.find((item) => item.scan_id === selected)
    if (!scan || reports.some((item) => item.scanId === selected)) return
    persist([
      {
        id: `INC-${String(Date.now()).slice(-6)}`,
        scanId: scan.scan_id,
        location: scan.location || 'Unspecified sector',
        level: level(scan),
        targets: scan.summary?.total_objects || 0,
        note: note || 'Detection reviewed for field response.',
        status: 'Open',
        created: new Date().toISOString(),
      },
      ...reports,
    ])
    setSelected('')
    setNote('')
  }

  const visible = filter === 'All' ? reports : reports.filter((report) => report.status === filter)

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="page-enter mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Records & reporting</p>
          <h1 className="m-0 font-display text-3xl font-bold tracking-tight text-slate-100">Incident reports</h1>
          <p className="mb-0 mt-2 text-sm text-slate-400">
            Turn reviewed detections into clear, actionable field records.
          </p>
        </div>
        <div className="flex rounded-xl border border-white/10 p-1">
          {['All', 'Open', 'Resolved'].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${
                filter === item
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-400 text-[#03202b]'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="page-enter-delay grid items-start gap-5 xl:grid-cols-[.9fr_1.35fr]">
        <Reveal>
          <section className="panel">
            <p className="eyebrow">Create report</p>
            <h2 className="m-0 font-display text-lg font-bold text-slate-100">Escalate a scan finding</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Select a completed scan, add field context, and keep its response status in one place.
            </p>
            <label className="mt-5 block">
              <span className="field-label">Reviewed scan</span>
              <select className="field-input" value={selected} onChange={(event) => setSelected(event.target.value)}>
                <option value="">Choose a scan to report</option>
                {scans
                  .filter((scan) => (scan.summary?.total_objects || 0) > 0)
                  .map((scan) => (
                    <option key={scan.scan_id} value={scan.scan_id}>
                      {scan.location || 'Unknown sector'} · {scan.summary.total_objects} target(s) · {level(scan)}
                    </option>
                  ))}
              </select>
            </label>
            <label className="mt-3 block">
              <span className="field-label">Response note</span>
              <textarea
                className="field-input min-h-24 resize-y"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="e.g. Notify the local cleanup crew before the next tide."
              />
            </label>
            <button
              onClick={create}
              disabled={!selected || reports.some((item) => item.scanId === selected)}
              className="action mt-5 w-full gap-2"
            >
              <Icon name="report" className="h-4 w-4" />
              Create incident report
            </button>
            <p className="mb-0 mt-3 text-[10px] text-slate-500">
              Reports are saved to this browser and remain available after refresh.
            </p>
          </section>
        </Reveal>

        <Reveal delay={0.1}>
          <section className="panel overflow-hidden !p-0">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="m-0 font-display text-sm font-bold text-slate-100">Response queue</h2>
                <p className="mb-0 mt-1 text-[10px] text-slate-400">
                  {visible.length} {filter.toLowerCase()} report{visible.length === 1 ? '' : 's'}
                </p>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400/10 text-cyan-300">
                <Icon name="report" className="h-4 w-4" />
              </span>
            </div>
            {visible.length ? (
              <div className="divide-y divide-white/10">
                {visible.map((report, i) => (
                  <motion.article
                    key={report.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: Math.min(i, 8) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    className="p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="m-0 font-mono text-[10px] font-bold text-cyan-300">{report.id}</p>
                        <h3 className="mb-0 mt-1 text-sm font-bold text-slate-100">{report.location}</h3>
                      </div>
                      <div className="flex gap-2">
                        <Badge tone={levelTone(report.level)}>{report.level} priority</Badge>
                        <Badge tone={report.status === 'Resolved' ? 'emerald' : 'cyan'}>{report.status}</Badge>
                      </div>
                    </div>
                    <p className="mb-0 mt-3 text-xs leading-5 text-slate-400">{report.note}</p>
                    <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500">
                      <span>
                        {report.targets} detected target{report.targets === 1 ? '' : 's'} ·{' '}
                        {new Date(report.created).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() =>
                          persist(
                            reports.map((item) =>
                              item.id === report.id
                                ? { ...item, status: item.status === 'Open' ? 'Resolved' : 'Open' }
                                : item
                            )
                          )
                        }
                        className="font-bold text-cyan-300 transition hover:text-cyan-200"
                      >
                        Mark {report.status === 'Open' ? 'resolved' : 'open'}
                      </button>
                    </div>
                  </motion.article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="report"
                title={`No ${filter.toLowerCase()} reports`}
                sub="Use the review form to create a field-ready incident record."
              />
            )}
          </section>
        </Reveal>
      </div>
    </div>
  )
}
