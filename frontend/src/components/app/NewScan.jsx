import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getScanFeedback, saveScanFeedback, uploadScan } from '../../api/api'
import { EmptyState, Icon, SonarRadar } from '../ui'
import ScanChat from './ScanChat'

/* ============================== UPLOAD PANEL ============================== */
function UploadPanel({ onResult, onError }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [location, setLocation] = useState('')
  const [depth, setDepth] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [geoBusy, setGeoBusy] = useState(false)

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) return onError('Geolocation is not available in this browser.')
    setGeoBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(5))
        setLng(pos.coords.longitude.toFixed(5))
        setGeoBusy(false)
      },
      () => { setGeoBusy(false); onError('Could not read your position. Enter coordinates manually.') },
      { timeout: 10000 }
    )
  }

  const parsedCoords = () => {
    const la = parseFloat(lat), ln = parseFloat(lng)
    if (Number.isNaN(la) || Number.isNaN(ln)) return null
    return { lat: la, lng: ln }
  }
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const input = useRef(null)

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview('')
    setProgress(0)
  }

  const choose = (value) => {
    if (!value) return
    if (!value.type.startsWith('image/')) return onError('Select a valid sonar image file.')
    if (preview) URL.revokeObjectURL(preview)
    setFile(value)
    setPreview(URL.createObjectURL(value))
    setProgress(0)
  }

  const submit = async () => {
    if (!file) return onError('Choose a side-scan sonar image first.')
    setLoading(true)
    try {
      onResult(await uploadScan(file, location, Number(depth) || 0, setProgress, parsedCoords()))
    } catch (error) {
      onError(error?.response?.data?.detail || 'The scan could not be processed. Check that FastAPI is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel overflow-hidden !p-0">
      <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-[#073654] to-teal-700/60 px-5 py-5 text-white">
        <div className="absolute right-0 top-0 h-24 w-24 animate-drift rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow !mb-0">New mission</p>
            <h2 className="mb-0 mt-1 font-display text-lg font-bold text-slate-100">Prepare a sonar frame</h2>
            <p className="mb-0 mt-1 text-xs leading-5 text-slate-300/80">Upload, add survey context, and let the detector map possible debris.</p>
          </div>
          <span className="grid h-9 w-9 shrink-0 animate-float place-items-center rounded-xl border border-white/20 bg-white/10 text-sm font-black">
            01
          </span>
        </div>
        <div className="relative mt-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-wide text-cyan-100">
          <span className="flex items-center gap-1.5">
            <i className="h-1.5 w-1.5 rounded-full bg-teal-300" />
            Frame
          </span>
          <span className="h-px flex-1 bg-white/20" />
          <span className="opacity-60">Context</span>
          <span className="h-px flex-1 bg-white/20" />
          <span className="opacity-60">Review</span>
        </div>
      </div>

      <div className="p-5">
        <div
          onClick={() => input.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files?.[0]) }}
          className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-5 transition ${
            dragging ? 'border-cyan-300/70 bg-cyan-400/10' : 'border-white/10 hover:border-cyan-300/40 hover:bg-cyan-400/5'
          }`}
        >
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Selected sonar frame" className="h-44 w-full rounded-xl object-cover" />
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="scanline absolute inset-0 grid place-items-center rounded-xl bg-[#030b12]/70 backdrop-blur-[2px]"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <SonarRadar size={120} blips={6} />
                      <p className="m-0 font-mono text-[11px] font-bold uppercase tracking-[.2em] text-cyan-300">
                        Sweeping sector… {progress}%
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="absolute inset-x-2 bottom-2 flex items-center justify-between rounded-xl bg-[#073654]/90 px-3 py-2 text-xs text-white">
                <span className="max-w-[180px] truncate font-bold">{file.name}</span>
                <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            </div>
          ) : (
            <>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-cyan-400/10 text-cyan-300 transition group-hover:scale-110">
                <Icon name="upload" className="h-6 w-6" />
              </div>
              <p className="mb-1 mt-3 text-center text-sm font-bold text-slate-100">Drop in your survey image</p>
              <p className="m-0 text-center text-xs text-slate-400">
                Drag a frame here, or <span className="font-bold text-cyan-300">browse your files</span>
              </p>
              <div className="mt-4 flex justify-center gap-2">
                {['PNG', 'JPG', 'TIFF'].map((t) => (
                  <span key={t} className="rounded-lg border border-white/10 px-2 py-1 text-[9px] font-bold text-slate-400">{t}</span>
                ))}
              </div>
            </>
          )}
          <input ref={input} hidden type="file" accept="image/*,.tif,.tiff" onChange={(event) => choose(event.target.files?.[0])} />
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="eyebrow !mb-0">Survey context</p>
            <span className="text-[10px] text-slate-500">Optional, but useful later</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Survey location</span>
              <input className="field-input" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Kochi Coast, Transect 4" />
            </label>
            <label className="block">
              <span className="field-label">Depth (metres)</span>
              <input className="field-input" type="number" min="0" value={depth} onChange={(event) => setDepth(event.target.value)} placeholder="42" />
            </label>
            <label className="block">
              <span className="field-label">Latitude</span>
              <input className="field-input font-mono" type="number" step="any" min="-90" max="90" value={lat} onChange={(event) => setLat(event.target.value)} placeholder="9.9312" />
            </label>
            <label className="block">
              <span className="field-label">Longitude</span>
              <input className="field-input font-mono" type="number" step="any" min="-180" max="180" value={lng} onChange={(event) => setLng(event.target.value)} placeholder="76.2673" />
            </label>
          </div>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={loading || geoBusy}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3.5 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400/20 disabled:opacity-50"
          >
            <Icon name="map" className="h-3.5 w-3.5" />
            {geoBusy ? 'Reading position…' : 'Use my current position'}
          </button>
          <p className="mb-0 mt-2 text-[11px] leading-4 text-slate-500">
            Pinned scans appear on the Survey Map — debris gets plotted where it was actually found.
          </p>
        </div>

        <div className="mt-5 flex gap-3">
          <button className="action flex-1 gap-2" disabled={loading || !file} onClick={submit}>
            {loading ? `Analysing frame ${progress}%` : 'Run debris analysis'}
          </button>
          {file && (
            <button className="action-secondary" disabled={loading} onClick={clearFile}>
              Change
            </button>
          )}
        </div>
        {loading && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-300 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <div className="mt-5 flex gap-2 border-t border-white/10 pt-4">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-cyan-400/10 text-cyan-300">
            <Icon name="check" className="h-3.5 w-3.5" />
          </span>
          <p className="m-0 text-[10px] leading-4 text-slate-400">
            Your image and survey details are securely saved with each detection result.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ============================== DETECTION VIEWER ============================== */
const Stat = ({ value, label, alert }) => (
  <div className="rounded-2xl border border-white/10 bg-cyan-400/5 p-3">
    <p className={`m-0 font-display text-xl font-bold ${alert ? 'text-rose-300' : 'text-cyan-300'}`}>{value}</p>
    <p className="mb-0 mt-1 text-[11px] font-semibold text-slate-400">{label}</p>
  </div>
)
const categories = ['Aircraft', 'Mine', 'Shipwreck', 'Pipeline', 'Fishing_Net']

function DetectionViewer({ result, onUpdated, onViewMap }) {
  const [view, setView] = useState('annotated')
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [corrections, setCorrections] = useState([])
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')
  const [imageSize, setImageSize] = useState(null)

  useEffect(() => {
    if (!result?.scan_id) return
    setFeedbackOpen(false)
    setSaved(false)
    setView('annotated')
    getScanFeedback(result.scan_id)
      .then((data) => {
        setCorrections(data.corrections || [])
        setNote(data.note || '')
      })
      .catch(() => {
        setCorrections([])
        setNote('')
      })
  }, [result?.scan_id])

  if (!result) return null

  const { summary, detections } = result
  const urls = {
    annotated: result.annotated_image_url,
    original: result.original_image_url,
    mask: result.mask_image_url,
  }
  const viewNames = {
    annotated: 'Live review overlay',
    original: 'Original',
    mask: 'Detection zones',
  }
  const correctionFor = (id) =>
    corrections.find((item) => item.id === String(id)) || {
      id: String(id),
      label: '',
      severity: '',
      status: 'confirmed',
    }
  const change = (id, key, value) => {
    setSaved(false)
    setFeedbackError('')
    setCorrections((current) => {
      const item = current.find((row) => row.id === String(id)) || {
        id: String(id),
        label: '',
        severity: '',
        status: 'confirmed',
      }
      return [...current.filter((row) => row.id !== String(id)), { ...item, [key]: value }]
    })
  }
  const corrected = (detection) => ({
    ...detection,
    ...correctionFor(detection.id),
    label: correctionFor(detection.id).label || detection.label,
    severity: correctionFor(detection.id).severity || detection.severity,
  })
  const save = async () => {
    setSaving(true)
    setFeedbackError('')
    try {
      const response = await saveScanFeedback(result.scan_id, corrections, note)
      setCorrections(response.corrections || corrections)
      setNote(response.note || note)
      setSaved(true)
      if (response.scan) onUpdated?.(response.scan)
    } catch (error) {
      setFeedbackError(
        error?.response?.data?.detail || 'Feedback could not be saved. Restart the API once to enable the feedback endpoint.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel !p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Scan result</p>
          <h2 className="m-0 font-display text-lg font-bold text-slate-100">Image review</h2>
        </div>
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-2.5 py-1 text-xs font-bold text-cyan-300"
        >
          Processed
        </motion.span>
      </div>

      {result.latitude != null && result.longitude != null ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3">
          <p className="m-0 flex items-center gap-2 text-xs font-semibold text-emerald-200">
            <Icon name="map" className="h-4 w-4" />
            Pinned to Survey Map · {Number(result.latitude).toFixed(4)}°, {Number(result.longitude).toFixed(4)}°
          </p>
          <button onClick={() => onViewMap?.(result.scan_id)} className="action !px-4 !py-2 text-xs">
            View on map <Icon name="arrow" className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-300/25 bg-amber-400/10 px-4 py-3">
          <Icon name="alert" className="h-4 w-4 shrink-0 text-amber-300" />
          <p className="m-0 text-xs leading-5 text-amber-200/90">
            No coordinates attached — add latitude/longitude before scanning to pin this result on the Survey Map.
          </p>
        </div>
      )}

      <div className="mt-5 flex gap-2 border-b border-white/10 pb-3">
        {Object.keys(urls).map((key) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              view === key
                ? 'bg-gradient-to-r from-teal-500 to-cyan-400 text-[#03202b]'
                : 'text-slate-400 hover:bg-cyan-400/10 hover:text-slate-100'
            }`}
          >
            {viewNames[key]}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${view}-${result.scan_id}`}
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {view === 'annotated' ? (
            <div className="relative mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#061c2c]">
              <img
                src={result.original_image_url}
                onLoad={(event) =>
                  setImageSize({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
                  })
                }
                alt="Live corrected detection overlay"
                className="block h-auto w-full"
              />
              {imageSize &&
                detections.map((detection, i) => {
                  const item = corrected(detection)
                  if (item.status === 'false_positive' || item.excluded) return null
                  const [x, y, width, height] = detection.bbox
                  const color =
                    item.severity === 'high'
                      ? '#ef4444'
                      : item.severity === 'medium'
                        ? '#f59e0b'
                        : '#20b486'
                  return (
                    <motion.div
                      key={detection.id}
                      initial={{ opacity: 0, scale: 0.55 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                      className="pointer-events-none absolute border-2"
                      style={{
                        left: `${(x / imageSize.width) * 100}%`,
                        top: `${(y / imageSize.height) * 100}%`,
                        width: `${(width / imageSize.width) * 100}%`,
                        height: `${(height / imageSize.height) * 100}%`,
                        borderColor: color,
                        boxShadow: `0 0 18px ${color}55`,
                      }}
                    >
                      <span
                        className="absolute -top-5 left-0 max-w-[220px] truncate whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {item.label} · {item.severity}
                      </span>
                    </motion.div>
                  )
                })}
            </div>
          ) : (
            <img
              src={urls[view]}
              alt={`${viewNames[view]} sonar result`}
              className="mt-4 max-h-[430px] w-full rounded-xl border border-white/10 bg-[#061c2c] object-contain"
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={summary.total_objects} label="Targets" />
        <Stat value={summary.debris_count} label="Debris signals" />
        <Stat value={summary.severity_counts?.high || 0} label="High priority" alert />
        <Stat value={`${Math.round(summary.avg_confidence * 100)}%`} label="Average confidence" />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="eyebrow !mb-0">Detected targets</p>
          <button
            onClick={() => setFeedbackOpen((value) => !value)}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-400/10 px-2.5 py-1.5 text-[10px] font-bold text-cyan-300 transition hover:bg-cyan-400/20"
          >
            <Icon name="settings" className="h-3.5 w-3.5" />
            {feedbackOpen ? 'Close correction' : 'Correct findings'}
          </button>
        </div>
        {detections.length ? (
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
            {detections.map((detection, i) => {
              const item = corrected(detection)
              const correction = correctionFor(detection.id)
              return (
                <motion.div
                  key={detection.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className={`rounded-xl border border-white/10 bg-cyan-400/5 px-3 py-2.5 ${
                    item.status === 'false_positive' ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="m-0 text-sm font-semibold text-slate-100">{item.label}</p>
                      <p className="mb-0 mt-1 text-[11px] text-slate-400">
                        {Math.round(detection.confidence * 100)}% confidence | {detection.area_px.toLocaleString()} px²
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                        item.severity === 'high'
                          ? 'bg-rose-400/15 text-rose-300'
                          : item.severity === 'medium'
                            ? 'bg-amber-400/15 text-amber-300'
                            : 'bg-emerald-400/15 text-emerald-300'
                      }`}
                    >
                      {item.status === 'false_positive' ? 'Excluded' : item.severity}
                    </span>
                  </div>
                  {feedbackOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-3"
                    >
                      <label className="block">
                        <span className="field-label !text-[10px]">Category</span>
                        <select
                          className="field-input !py-2 text-xs"
                          value={correction.label || detection.label}
                          onChange={(e) => change(detection.id, 'label', e.target.value)}
                        >
                          {[detection.label, ...categories.filter((x) => x !== detection.label)].map((value) => (
                            <option key={value}>{value}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="field-label !text-[10px]">Priority</span>
                        <select
                          className="field-input !py-2 text-xs"
                          value={correction.severity || detection.severity}
                          onChange={(e) => change(detection.id, 'severity', e.target.value)}
                        >
                          {['low', 'medium', 'high'].map((value) => (
                            <option key={value}>{value}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="field-label !text-[10px]">Review decision</span>
                        <select
                          className="field-input !py-2 text-xs"
                          value={correction.status}
                          onChange={(e) => change(detection.id, 'status', e.target.value)}
                        >
                          <option value="confirmed">Confirm target</option>
                          <option value="needs_review">Needs review</option>
                          <option value="false_positive">False positive</option>
                        </select>
                      </label>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No targets met the current confidence threshold.</p>
        )}
      </div>

      {feedbackOpen && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-white/10 bg-cyan-400/5 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="m-0 text-xs font-bold text-cyan-300">Analyst feedback loop</p>
            {saved && (
              <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[9px] font-bold text-emerald-300">
                Saved to scan
              </span>
            )}
          </div>
          <p className="mb-3 mt-1 text-[10px] leading-4 text-slate-500">
            Edit any category, priority, or decision above. The updated values apply immediately in this
            review and are stored with the scan.
          </p>
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value)
              setSaved(false)
            }}
            className="field-input min-h-16 resize-y text-xs"
            placeholder="Optional analyst note for this review"
          />
          {feedbackError && (
            <p role="alert" className="mb-0 mt-3 rounded-lg border border-rose-300/25 bg-rose-400/10 p-2 text-[10px] text-rose-200">
              {feedbackError}
            </p>
          )}
          <button onClick={save} disabled={saving} className="action mt-3 w-full gap-2 text-xs">
            <Icon name="check" className="h-4 w-4" />
            {saving ? 'Saving feedback…' : saved ? 'Save changes' : 'Save corrections'}
          </button>
        </motion.div>
      )}
    </section>
  )
}

/* ============================== NEW SCAN PAGE ============================== */
export default function NewScan({ result, onResult, onError, onViewMap }) {
  const [viewResult, setViewResult] = useState(result)

  useEffect(() => {
    setViewResult(result)
  }, [result?.scan_id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="page-enter mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Operations</p>
          <h1 className="m-0 font-display text-3xl font-bold tracking-tight text-slate-100">New marine scan</h1>
          <p className="mb-0 mt-2 text-sm text-slate-400">
            Upload a sonar frame, run the detector, then review every target with analyst corrections.
          </p>
        </div>
        {viewResult && (
          <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 font-mono text-[11px] font-bold text-cyan-300">
            SCN-{viewResult.scan_id.slice(0, 8)}
          </span>
        )}
      </div>

      <div className="page-enter-delay grid items-start gap-5 xl:grid-cols-[.9fr_1.25fr]">
        <UploadPanel onResult={onResult} onError={onError} />
        <div>
          {viewResult ? (
            <DetectionViewer result={viewResult} onUpdated={setViewResult} onViewMap={onViewMap} />
          ) : (
            <section className="panel flex min-h-[560px] flex-col">
              <p className="eyebrow">Scan result</p>
              <h2 className="m-0 font-display text-lg font-bold text-slate-100">Image review</h2>
              <div className="grid flex-1 place-items-center">
                <EmptyState
                  icon="radar"
                  title="Results will appear here"
                  sub="Process a sonar image to review model detections with animated overlays."
                />
              </div>
            </section>
          )}
        </div>
      </div>

      {viewResult && <ScanChat scanId={viewResult.scan_id} />}
    </div>
  )
}
