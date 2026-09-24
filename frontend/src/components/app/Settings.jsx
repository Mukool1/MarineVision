import { useState } from 'react'
import { motion } from 'framer-motion'
import { Icon, Reveal } from '../ui'

const defaults = {
  name: 'MarineVision Operations',
  location: 'Indian Ocean monitoring zone',
  threshold: '60',
  alerts: true,
  digest: true,
  autoSave: true,
}
const readSettings = () => {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem('marinevision_settings') || '{}') }
  } catch {
    return defaults
  }
}

export default function Settings() {
  const [settings, setSettings] = useState(readSettings)
  const [saved, setSaved] = useState(false)

  const change = (key, value) => setSettings((current) => ({ ...current, [key]: value }))
  const save = () => {
    localStorage.setItem('marinevision_settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const Toggle = ({ id, title, text }) => {
    const on = !!settings[id]
    return (
      <div className="flex items-center justify-between gap-4 py-4">
        <div>
          <p className="m-0 text-sm font-bold text-slate-100">{title}</p>
          <p className="mb-0 mt-1 text-xs text-slate-400">{text}</p>
        </div>
        <button
          aria-label={title}
          onClick={() => change(id, !on)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
            on ? 'bg-gradient-to-r from-teal-500 to-cyan-400 shadow-glow' : 'bg-white/10'
          }`}
        >
          <motion.span
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow ${on ? 'right-1' : 'left-1'}`}
          />
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="page-enter mb-6">
        <p className="eyebrow">System</p>
        <h1 className="m-0 font-display text-3xl font-bold tracking-tight text-slate-100">Settings</h1>
        <p className="mb-0 mt-2 text-sm text-slate-400">
          Configure how MarineVision labels, reviews, and notifies your monitoring team.
        </p>
      </div>

      <div className="page-enter-delay grid items-start gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <div className="space-y-5">
          <Reveal>
            <section className="panel">
              <p className="eyebrow">Workspace</p>
              <h2 className="m-0 font-display text-lg font-bold text-slate-100">Survey defaults</h2>
              <div className="mt-5 grid gap-4">
                <label className="block">
                  <span className="field-label">Workspace name</span>
                  <input className="field-input" value={settings.name} onChange={(e) => change('name', e.target.value)} />
                </label>
                <label className="block">
                  <span className="field-label">Default survey area</span>
                  <input className="field-input" value={settings.location} onChange={(e) => change('location', e.target.value)} />
                </label>
                <label className="block">
                  <span className="field-label">
                    Minimum confidence threshold{' '}
                    <b className="float-right text-cyan-300">{settings.threshold}%</b>
                  </span>
                  <input
                    className="w-full"
                    type="range"
                    min="30"
                    max="95"
                    value={settings.threshold}
                    onChange={(e) => change('threshold', e.target.value)}
                  />
                </label>
              </div>
            </section>
          </Reveal>
          <Reveal delay={0.08}>
            <section className="panel">
              <p className="eyebrow">Workflow</p>
              <h2 className="m-0 font-display text-lg font-bold text-slate-100">Notifications & retention</h2>
              <div className="mt-3 divide-y divide-white/10">
                <Toggle id="alerts" title="High-priority alerts" text="Highlight high-severity detections during review." />
                <Toggle id="digest" title="Daily activity digest" text="Show a daily summary when you open the workspace." />
                <Toggle id="autoSave" title="Save survey metadata" text="Remember your latest survey context for the next scan." />
              </div>
            </section>
          </Reveal>
        </div>

        <Reveal delay={0.12}>
          <aside className="panel h-fit">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 text-[#03202b]">
              <Icon name="settings" className="h-5 w-5" />
            </span>
            <h2 className="mb-0 mt-4 font-display text-base font-bold text-slate-100">Ready for the next survey</h2>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Your preferences apply on this device and help keep every scan consistent across the team.
            </p>
            <button onClick={save} className="action mt-4 w-full gap-2">
              <Icon name="check" className="h-4 w-4" />
              {saved ? 'Preferences saved' : 'Save preferences'}
            </button>
            <button
              onClick={() => setSettings(defaults)}
              className="mt-2 w-full rounded-lg px-3 py-2 text-xs font-bold text-slate-400 transition hover:bg-cyan-400/10 hover:text-slate-100"
            >
              Restore defaults
            </button>
          </aside>
        </Reveal>
      </div>
    </div>
  )
}
