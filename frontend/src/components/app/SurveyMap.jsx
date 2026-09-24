import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapContainer, Marker, Popup, Rectangle, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { getMapPoints, getMapSectors } from '../../api/api'
import { Badge, EmptyState, Icon, Reveal, SectionHeader } from '../ui'

const SEV_TONE = { high: 'rose', medium: 'amber', low: 'emerald' }

function pinIcon(severity) {
  return L.divIcon({
    className: '',
    html: `<div class="map-pin sev-${severity}"><span class="halo"></span><span class="dot"></span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -14],
  })
}

function HeatLayer({ points }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return undefined
    const layer = L.heatLayer(
      points.map((p) => [p.lat, p.lng, Math.min(1, 0.25 + p.debris_count / 8)]),
      { radius: 30, blur: 24, maxZoom: 10, gradient: { 0.3: '#0ea5e9', 0.55: '#fbbf24', 0.8: '#f43f5e' } }
    ).addTo(map)
    return () => map.removeLayer(layer)
  }, [map, points])
  return null
}

function FitToPoints({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 1) map.flyToBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])).pad(0.25), { duration: 1.2 })
    else if (points.length === 1) map.flyTo([points[0].lat, points[0].lng], 9, { duration: 1.2 })
  }, [map, points])
  return null
}

function LocateButton() {
  const map = useMap()
  return (
    <button
      onClick={() => map.locate({ setView: true, maxZoom: 9 })}
      title="Centre on my position"
      className="absolute bottom-24 right-4 z-[500] grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-[#071c2a]/90 text-cyan-200 shadow-glow backdrop-blur transition hover:text-cyan-100"
    >
      <Icon name="map" className="h-4 w-4" />
    </button>
  )
}

const sectorStyle = (sector) => ({
  color: sector.hotspot ? '#f43f5e' : sector.debris_count > 0 ? '#f59e0b' : '#22d3ee',
  weight: sector.hotspot ? 2 : 1,
  dashArray: sector.hotspot ? '6 4' : undefined,
  fillColor: sector.hotspot ? '#f43f5e' : sector.debris_count > 0 ? '#f59e0b' : '#22d3ee',
  fillOpacity: sector.debris_count === 0 ? 0.06 : Math.min(0.45, 0.12 + sector.debris_count / 18),
})

function ScanDrawer({ point, onClose, onOpenScan }) {
  return (
    <motion.aside
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 60, opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="absolute right-4 top-4 z-[600] w-[320px] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-white/12 bg-[#071c2a]/95 shadow-glow-lg backdrop-blur-xl"
    >
      <div className="relative h-36">
        <img src={point.thumbnail_url} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071c2a] via-transparent to-transparent" />
        <button onClick={onClose} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg bg-black/50 text-slate-200 backdrop-blur transition hover:text-white">
          <Icon name="x" className="h-4 w-4" />
        </button>
        <div className="absolute bottom-2 left-4">
          <Badge tone={SEV_TONE[point.severity] || 'emerald'}>{point.severity} severity</Badge>
        </div>
      </div>
      <div className="p-4">
        <p className="m-0 font-mono text-[10px] uppercase tracking-widest text-slate-500">{point.scan_id.slice(0, 8)}</p>
        <h3 className="m-0 mt-1 font-display text-base font-bold text-slate-100">{point.location}</h3>
        <p className="m-0 mt-1 font-mono text-[11px] text-cyan-300/80">
          {point.lat.toFixed(4)}°, {point.lng.toFixed(4)}° · {point.depth_m} m
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            [point.total_objects, 'targets'],
            [point.debris_count, 'debris'],
            [Object.keys(point.by_label).length, 'classes'],
          ].map(([v, l]) => (
            <div key={l} className="rounded-xl border border-white/10 bg-white/[.04] px-2 py-2.5">
              <p className="m-0 font-display text-lg font-bold text-slate-100">{v}</p>
              <p className="m-0 text-[9px] uppercase tracking-widest text-slate-500">{l}</p>
            </div>
          ))}
        </div>
        {Object.keys(point.by_label).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(point.by_label).map(([label, count]) => (
              <span key={label} className="rounded-full border border-white/10 bg-white/[.05] px-2.5 py-1 text-[10px] font-semibold text-slate-300">
                {label.replace(/_/g, ' ')} ×{count}
              </span>
            ))}
          </div>
        )}
        <button onClick={() => onOpenScan(point.scan_id)} className="action mt-4 w-full !py-2.5 text-xs">
          Open full scan <Icon name="arrow" className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.aside>
  )
}

export default function SurveyMap({ onOpenScan, focusScanId, onFocusConsumed }) {
  const [points, setPoints] = useState([])
  const [sectors, setSectors] = useState([])
  const [loading, setLoading] = useState(true)
  const [layers, setLayers] = useState({ pins: true, heat: true, grid: false })
  const [selected, setSelected] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    Promise.all([getMapPoints(), getMapSectors(2)])
      .then(([p, s]) => { setPoints(p); setSectors(s) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [refreshKey])

  useEffect(() => {
    if (focusScanId && points.length) {
      const match = points.find((p) => p.scan_id === focusScanId)
      if (match) setSelected(match)
      onFocusConsumed?.()
    }
  }, [focusScanId, points]) // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const debris = points.reduce((a, p) => a + p.debris_count, 0)
    const hotspots = sectors.filter((s) => s.hotspot).length
    return [
      { label: 'Pinned scans', value: points.length },
      { label: 'Debris mapped', value: debris },
      { label: 'Sectors surveyed', value: sectors.length },
      { label: 'Hotspots', value: hotspots },
    ]
  }, [points, sectors])

  const toggle = (key) => setLayers((l) => ({ ...l, [key]: !l[key] }))

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="page-enter mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Geospatial survey</p>
          <h1 className="m-0 font-display text-3xl font-bold tracking-tight text-slate-100">
            The sea, <span className="text-gradient">mapped for debris</span>
          </h1>
          <p className="mb-0 mt-2 max-w-xl text-sm text-slate-400">
            Every scan pinned with coordinates lands here. Watch debris fields grow,
            spot hotspots, and see exactly which sectors still need surveying.
          </p>
        </div>
        <button onClick={() => setRefreshKey((k) => k + 1)} className="action-secondary !py-2.5 text-xs">
          <Icon name="refresh" className="h-3.5 w-3.5" /> Refresh chart
        </button>
      </div>

      <Reveal className="page-enter-delay mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="panel !p-4 text-center">
            <p className="m-0 font-display text-3xl font-bold text-slate-100">{s.value}</p>
            <p className="m-0 mt-1 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">{s.label}</p>
          </div>
        ))}
      </Reveal>

      <Reveal delay={0.1} className="page-enter-delay">
        <div className="panel relative overflow-hidden !p-0">
          {/* layer controls */}
          <div className="absolute left-4 top-4 z-[500] flex flex-wrap gap-2">
            {[
              ['pins', 'Scan pins'],
              ['heat', 'Debris heat'],
              ['grid', 'Survey grid'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => toggle(key)}
                className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-widest backdrop-blur-xl transition ${
                  layers[key]
                    ? 'border-cyan-300/40 bg-cyan-400/20 text-cyan-100 shadow-glow'
                    : 'border-white/15 bg-[#071c2a]/85 text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="map-dark relative h-[62vh] min-h-[440px] w-full">
            <MapContainer center={[11, 76]} zoom={5} className="h-full w-full" zoomControl={false} worldCopyJump>
              <TileLayer
                attribution="Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
              />
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}"
              />
              {layers.grid && sectors.map((s, i) => (
                <Rectangle key={i} bounds={s.bounds} pathOptions={sectorStyle(s)}>
                  <Popup>
                    <div className="p-3 text-sm">
                      <p className="m-0 font-bold text-slate-100">
                        {s.hotspot ? 'Hotspot sector' : s.debris_count > 0 ? 'Surveyed sector' : 'Clear sector'}
                      </p>
                      <p className="m-0 mt-1 text-xs text-slate-400">
                        {s.scan_count} scans · {s.debris_count} debris items mapped
                      </p>
                    </div>
                  </Popup>
                </Rectangle>
              ))}
              {layers.heat && <HeatLayer points={points} />}
              {layers.pins && points.map((p) => (
                <Marker key={p.scan_id} position={[p.lat, p.lng]} icon={pinIcon(p.severity)} eventHandlers={{ click: () => setSelected(p) }} />
              ))}
              <FitToPoints points={points} />
              <LocateButton />
            </MapContainer>

            <AnimatePresence>
              {selected && <ScanDrawer point={selected} onClose={() => setSelected(null)} onOpenScan={onOpenScan} />}
            </AnimatePresence>

            {loading && (
              <div className="absolute inset-0 z-[700] grid place-items-center bg-[#04121c]/70 backdrop-blur-sm">
                <div className="text-center">
                  <div className="relative mx-auto mb-4 h-14 w-14">
                    <div className="absolute inset-0 animate-ping-slow rounded-full border border-cyan-300/50" />
                    <div className="absolute inset-0"><div className="ring-conic h-full w-full animate-sweep" /></div>
                  </div>
                  <p className="m-0 font-mono text-[11px] uppercase tracking-[.25em] text-cyan-300/70">Charting waters…</p>
                </div>
              </div>
            )}

            {!loading && points.length === 0 && (
              <div className="absolute inset-0 z-[600] grid place-items-center bg-[#04121c]/60 p-6 backdrop-blur-[2px]">
                <div className="max-w-sm text-center">
                  <EmptyState icon="map" title="No pinned scans yet" copy="Run a scan with latitude and longitude attached and it will surface on this chart as a live pin." />
                </div>
              </div>
            )}
          </div>

          {/* legend */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 px-5 py-3.5 text-[11px] text-slate-400">
            <span className="font-bold uppercase tracking-widest text-slate-500">Legend</span>
            {[
              ['#f87171', 'High severity'],
              ['#fbbf24', 'Medium severity'],
              ['#34d399', 'Low severity'],
            ].map(([c, l]) => (
              <span key={l} className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
                {l}
              </span>
            ))}
            <span className="ml-auto hidden font-mono text-[10px] text-slate-600 sm:block">Drag to pan · Scroll to zoom · Click a pin for detail</span>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
