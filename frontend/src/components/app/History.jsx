import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { deleteScan, getHistory, getScanDetail } from '../../api/api'
import { Badge, EmptyState, Icon } from '../ui'

const severityFor = (scan) =>
  scan?.summary?.severity_counts?.high ? 'High' : scan?.summary?.severity_counts?.medium ? 'Medium' : 'Low'
const severityTone = (severity) =>
  severity === 'High' ? 'rose' : severity === 'Medium' ? 'amber' : 'emerald'

const filters = ['All', 'High', 'Medium', 'Low']

export default function History({ refreshKey, onSelect }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState('All')
  const [scanId, setScanId] = useState('')
  const [lookupError, setLookupError] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)

  const load = () => {
    setLoading(true)
    getHistory().then(setRows).catch(() => setRows([])).finally(() => setLoading(false))
  }

  useEffect(load, [refreshKey])

  const open = async (id) => {
    const scan = await getScanDetail(id)
    onSelect(scan)
  }

  /** Jump straight to a scan from a shared scan ID (full UUID or SCN-xxxxxxxx). */
  const lookupById = async (event) => {
    event.preventDefault()
    const raw = scanId.trim().toLowerCase()
    if (!raw) return
    const q = raw.startsWith('scn-') ? raw.slice(4) : raw
    setLookupError('')
    setLookupLoading(true)
    try {
      const local = rows.find(
        (row) => row.scan_id === q || row.scan_id.toLowerCase().startsWith(q)
      )
      if (local) {
        await open(local.scan_id)
        return
      }
      // Not in the loaded page — try the full ID directly against the API.
      await open(q)
    } catch {
      setLookupError('No scan found with that ID.')
    } finally {
      setLookupLoading(false)
    }
  }

  const remove = async (event, id) => {
    event.stopPropagation()
    if (window.confirm('Delete this scan record?')) {
      await deleteScan(id)
      load()
    }
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (severity !== 'All' && severityFor(row) !== severity) return false
      if (!q) return true
      return (
        (row.location || '').toLowerCase().includes(q) || (row.filename || '').toLowerCase().includes(q)
      )
    })
  }, [rows, search, severity])

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="page-enter mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Archive</p>
          <h1 className="m-0 font-display text-3xl font-bold tracking-tight text-slate-100">Scan history</h1>
          <p className="mb-0 mt-2 text-sm text-slate-400">
            Every processed survey, searchable by location or filename.
          </p>
        </div>
        <button className="action-secondary gap-2 text-xs" onClick={load}>
          <Icon name="refresh" className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="page-enter-delay mb-4 flex flex-wrap items-center gap-3">
        <label className="relative block min-w-0 flex-1 sm:max-w-xs">
          <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search location or filename…"
            className="field-input !pl-10 !py-2.5 text-xs"
          />
        </label>
        <form onSubmit={lookupById} className="relative block min-w-0 flex-1 sm:max-w-xs">
          <Icon name="pin" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={scanId}
            onChange={(e) => { setScanId(e.target.value); setLookupError('') }}
            placeholder="Open scan by ID… (SCN-xxxxxxxx)"
            className="field-input !pl-10 !py-2.5 font-mono text-xs"
          />
          {lookupError && (
            <p className="m-0 mt-1 text-[11px] font-semibold text-rose-300">{lookupError}</p>
          )}
        </form>
        <div className="flex gap-1.5 rounded-xl border border-white/10 p-1">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setSeverity(item)}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${
                severity === item
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-400 text-[#03202b]'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <section className="page-enter-delay panel overflow-hidden !p-0">
        {loading ? (
          <p className="p-5 text-sm text-slate-400">Loading records…</p>
        ) : !rows.length ? (
          <EmptyState
            icon="history"
            title="No scans have been saved yet"
            sub="Your processed surveys will appear here with full detection detail."
          />
        ) : !visible.length ? (
          <EmptyState
            icon="search"
            title="No scans match your filters"
            sub="Try a different search term or severity filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-5 py-3">Image</th>
                  <th className="px-3 py-3">Scan ID</th>
                  <th className="px-3 py-3">Location</th>
                  <th className="px-3 py-3">Depth</th>
                  <th className="px-3 py-3">Targets</th>
                  <th className="px-3 py-3">Severity</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {visible.map((row, i) => {
                  const sev = severityFor(row)
                  return (
                    <motion.tr
                      key={row.scan_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: Math.min(i, 12) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      onClick={() => open(row.scan_id)}
                      className="cursor-pointer border-t border-white/10 text-slate-200 transition hover:bg-cyan-400/5"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            className="h-10 w-14 rounded-md border border-white/10 object-cover"
                            src={row.annotated_image_url}
                            alt="Scan preview"
                          />
                          <span className="max-w-40 truncate text-xs font-medium">{row.filename}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-[11px] font-bold text-cyan-300">
                        SCN-{row.scan_id.slice(0, 8)}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">{row.location || 'Unknown sector'}</td>
                      <td className="px-3 py-3 text-xs">{row.depth_m} m</td>
                      <td className="px-3 py-3 text-xs">{row.summary.total_objects}</td>
                      <td className="px-3 py-3">
                        <Badge tone={severityTone(sev)}>{sev}</Badge>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">
                        {new Date(row.timestamp * 1000).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={(event) => remove(event, row.scan_id)}
                          className="rounded-lg border border-rose-300/40 px-2 py-1 text-[10px] font-bold text-rose-300 transition hover:bg-rose-400/10"
                        >
                          Delete
                        </button>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
