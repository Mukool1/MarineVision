import { useState } from 'react'
import Icon from './Icon'

const defaults = { name: 'MarineVision Operations', location: 'Indian Ocean monitoring zone', threshold: '60', alerts: true, digest: true, autoSave: true }
const readSettings = () => { try { return { ...defaults, ...JSON.parse(localStorage.getItem('marinevision_settings') || '{}') } } catch { return defaults } }

export default function Settings() {
  const [settings, setSettings] = useState(readSettings)
  const [saved, setSaved] = useState(false)
  const change = (key, value) => setSettings(current => ({ ...current, [key]: value }))
  const save = () => { localStorage.setItem('marinevision_settings', JSON.stringify(settings)); setSaved(true); setTimeout(() => setSaved(false), 2500) }
  const Toggle = ({ id, title, text }) => (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="m-0 text-sm font-bold text-ink">{title}</p>
        <p className="mb-0 mt-1 text-xs text-muted">{text}</p>
      </div>
      <button aria-label={title} onClick={() => change(id, !settings[id])} className={`relative h-6 w-11 rounded-full transition ${settings[id] ? 'bg-gradient-to-r from-teal-500 to-cyan-400' : 'bg-line'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${settings[id] ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  )
  return (
    <div className="mx-auto max-w-[900px]">
      <div className="page-enter mb-6">
        <h1 className="m-0 text-3xl font-extrabold tracking-tight text-ink">Settings</h1>
        <p className="mb-0 mt-2 text-sm text-muted">Configure how MarineVision labels, reviews, and notifies your monitoring team.</p>
      </div>
      <div className="page-enter-delay grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <div className="space-y-5">
          <section className="panel">
            <p className="eyebrow">Workspace</p>
            <h2 className="m-0 font-display text-lg font-bold text-ink">Survey defaults</h2>
            <div className="mt-5 grid gap-4">
              <label><span className="field-label">Workspace name</span><input className="field-input" value={settings.name} onChange={e => change('name', e.target.value)} /></label>
              <label><span className="field-label">Default survey area</span><input className="field-input" value={settings.location} onChange={e => change('location', e.target.value)} /></label>
              <label>
                <span className="field-label">Minimum confidence threshold <b className="float-right text-cyan">{settings.threshold}%</b></span>
                <input className="w-full accent-cyan-400" type="range" min="30" max="95" value={settings.threshold} onChange={e => change('threshold', e.target.value)} />
              </label>
            </div>
          </section>
          <section className="panel">
            <p className="eyebrow">Workflow</p>
            <h2 className="m-0 font-display text-lg font-bold text-ink">Notifications & retention</h2>
            <div className="mt-3 divide-y divide-[var(--line)]">
              <Toggle id="alerts" title="High-priority alerts" text="Highlight high-severity detections during review." />
              <Toggle id="digest" title="Daily activity digest" text="Show a daily summary when you open the workspace." />
              <Toggle id="autoSave" title="Save survey metadata" text="Remember your latest survey context for the next scan." />
            </div>
          </section>
        </div>
        <aside className="panel h-fit">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 text-slate-950"><Icon name="settings" className="h-5 w-5" /></span>
          <h2 className="mb-0 mt-4 font-display text-base font-bold text-ink">Ready for the next survey</h2>
          <p className="mt-2 text-xs leading-5 text-muted">Your preferences apply on this device and help keep every scan consistent across the team.</p>
          <button onClick={save} className="action mt-4 w-full gap-2"><Icon name="check" className="h-4 w-4" />{saved ? 'Preferences saved' : 'Save preferences'}</button>
          <button onClick={() => setSettings(defaults)} className="mt-2 w-full rounded-lg px-3 py-2 text-xs font-bold text-muted hover:bg-cyan-400/10">Restore defaults</button>
        </aside>
      </div>
    </div>
  )
}
