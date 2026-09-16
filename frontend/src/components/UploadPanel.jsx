import { useRef, useState } from 'react'
import { uploadScan } from '../api/api'

export default function UploadPanel({ onResult, onError }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [location, setLocation] = useState('')
  const [depth, setDepth] = useState('')
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

  const choose = value => {
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
      onResult(await uploadScan(file, location, Number(depth) || 0, setProgress))
    } catch (error) {
      onError(error?.response?.data?.detail || 'The scan could not be processed. Check that FastAPI is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel overflow-hidden p-0">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#073654] to-teal-700 px-5 py-5 text-white">
        <div className="absolute right-0 top-0 h-24 w-24 animate-drift rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="m-0 text-[10px] font-bold uppercase tracking-[.18em] text-cyan-200">New mission</p>
            <h2 className="mb-0 mt-1 font-display text-lg font-bold">Prepare a sonar frame</h2>
            <p className="mb-0 mt-1 text-xs leading-5 text-cyan-50/80">Upload, add survey context, and let the detector map possible debris.</p>
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-sm font-black">01</span>
        </div>
        <div className="relative mt-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-wide text-cyan-100">
          <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-[#74e1bb]" />Frame</span>
          <span className="h-px flex-1 bg-white/20" /><span className="opacity-60">Context</span>
          <span className="h-px flex-1 bg-white/20" /><span className="opacity-60">Review</span>
        </div>
      </div>
      <div className="p-5">
        <div
          onClick={() => input.current?.click()}
          onDragOver={event => { event.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={event => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files?.[0]) }}
          className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-5 transition ${dragging ? 'border-glow bg-cyan-400/10' : 'border-line hover:border-glow hover:bg-cyan-400/5'}`}
        >
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Selected sonar frame" className="h-44 w-full rounded-xl object-cover" />
              <div className="absolute inset-x-2 bottom-2 flex items-center justify-between rounded-xl bg-[#073654]/90 px-3 py-2 text-xs text-white">
                <span className="max-w-[180px] truncate font-bold">{file.name}</span>
                <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            </div>
          ) : (
            <>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-line bg-cyan-400/10 text-cyan shadow-sm">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 16V4m0 0 4 4m-4-4L8 8M5 15v4h14v-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <p className="mb-1 mt-3 text-center text-sm font-bold text-ink">Drop in your survey image</p>
              <p className="m-0 text-center text-xs text-muted">Drag a frame here, or <span className="font-bold text-cyan">browse your files</span></p>
              <div className="mt-4 flex justify-center gap-2">
                <span className="rounded-lg border border-line px-2 py-1 text-[9px] font-bold text-muted">PNG</span>
                <span className="rounded-lg border border-line px-2 py-1 text-[9px] font-bold text-muted">JPG</span>
                <span className="rounded-lg border border-line px-2 py-1 text-[9px] font-bold text-muted">TIFF</span>
              </div>
            </>
          )}
          <input ref={input} hidden type="file" accept="image/*,.tif,.tiff" onChange={event => choose(event.target.files?.[0])} />
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow mb-2">Survey context</p>
            <span className="text-[10px] text-muted">Optional, but useful later</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label><span className="field-label">Survey location</span><input className="field-input" value={location} onChange={event => setLocation(event.target.value)} placeholder="Kochi Coast, Transect 4" /></label>
            <label><span className="field-label">Depth (metres)</span><input className="field-input" type="number" min="0" value={depth} onChange={event => setDepth(event.target.value)} placeholder="42" /></label>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button className="action flex-1 gap-2" disabled={loading || !file} onClick={submit}>{loading ? `Analysing frame ${progress}%` : 'Run debris analysis'}</button>
          {file && <button className="action-secondary" disabled={loading} onClick={clearFile}>Change</button>}
        </div>
        {loading && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-300 transition-all" style={{ width: `${progress}%` }} /></div>}
        <div className="mt-5 flex gap-2 border-t border-line pt-4">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-cyan-400/10 text-cyan">✓</span>
          <p className="m-0 text-[10px] leading-4 text-muted">Your image and survey details are securely saved with each detection result.</p>
        </div>
      </div>
    </section>
  )
}
