import { useEffect, useState } from 'react'
import { deleteScan, getHistory, getScanDetail } from '../api/api'

export default function HistoryTable({ refreshKey, onSelect }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getHistory().then(setRows).catch(() => setRows([])).finally(() => setLoading(false))
  }

  useEffect(load, [refreshKey])

  const open = async id => {
    const scan = await getScanDetail(id)
    onSelect(scan)
  }

  const remove = async (event, id) => {
    event.stopPropagation()
    if (window.confirm('Delete this scan record?')) {
      await deleteScan(id)
      load()
    }
  }

  return <section className="panel overflow-hidden p-0"><div className="flex items-center justify-between border-b border-line p-5"><div><p className="eyebrow">Archive</p><h2 className="m-0 text-lg font-bold text-[#18383a]">Survey records</h2></div><button className="action-secondary py-2 text-xs" onClick={load}>Refresh</button></div>{loading ? <p className="p-5 text-sm text-muted">Loading records...</p> : !rows.length ? <div className="p-14 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#e6f4ef] text-xs font-black text-cyan">00</div><p className="mt-3 text-sm text-muted">No scans have been saved yet.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#f3f8f6] text-[10px] uppercase tracking-wider text-muted"><tr><th className="px-5 py-3">Image</th><th className="px-3 py-3">Location</th><th className="px-3 py-3">Depth</th><th className="px-3 py-3">Targets</th><th className="px-3 py-3">Debris</th><th className="px-3 py-3">Date</th><th className="px-5 py-3" /></tr></thead><tbody>{rows.map(row => <tr key={row.scan_id} onClick={() => open(row.scan_id)} className="cursor-pointer border-t border-line text-[#24484a] transition hover:bg-[#f7fbfa]"><td className="flex items-center gap-3 px-5 py-3"><img className="h-10 w-14 rounded-md border border-line object-cover" src={row.annotated_image_url} alt="Scan preview"/><span className="max-w-40 truncate font-medium">{row.filename}</span></td><td className="px-3 py-3 text-muted">{row.location}</td><td className="px-3 py-3">{row.depth_m} m</td><td className="px-3 py-3">{row.summary.total_objects}</td><td className="px-3 py-3 text-[#b97817]">{row.summary.debris_count}</td><td className="px-3 py-3 text-xs text-muted">{new Date(row.timestamp * 1000).toLocaleDateString()}</td><td className="px-5 py-3"><button onClick={event => remove(event, row.scan_id)} className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50">Delete</button></td></tr>)}</tbody></table></div>}</section>
}
