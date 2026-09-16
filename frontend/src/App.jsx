import { useEffect, useState } from 'react'
import UploadPanel from './components/UploadPanel'
import DetectionViewer from './components/DetectionViewer'
import Dashboard from './components/Dashboard'
import HistoryTable from './components/HistoryTable'
import Analytics from './components/Analytics'
import LoginPage from './components/LoginPage'
import AdminPage from './components/AdminPage'
import Reports from './components/Reports'
import Settings from './components/Settings'
import MarineChatbot from './components/MarineChatbot'
import Icon from './components/Icon'
import { checkHealth, getMe, getScanDetail, getStats } from './api/api'

const navGroups = [
  { label: 'Operations', links: [{ id: 'dashboard', name: 'Dashboard', icon: 'dashboard' }, { id: 'scan', name: 'New Scan', icon: 'upload' }, { id: 'history', name: 'Scan History', icon: 'history', badge: true }] },
  { label: 'Records & Reporting', links: [{ id: 'reports', name: 'Incident Reports', icon: 'report' }, { id: 'analytics', name: 'Analytics', icon: 'analytics' }] },
  { label: 'System', links: [{ id: 'settings', name: 'Settings', icon: 'settings' }] },
]

const pageNames = { dashboard: 'Dashboard Overview', scan: 'New Marine Scan', history: 'Scan History', reports: 'Incident Reports', analytics: 'Monitoring Analytics', settings: 'Settings', admin: 'Administration' }

function OceanBackdrop() {
  const bubbles = [
    { left: '8%', size: 8, delay: '0s', duration: '14s' },
    { left: '18%', size: 12, delay: '3s', duration: '18s' },
    { left: '32%', size: 6, delay: '6s', duration: '12s' },
    { left: '48%', size: 10, delay: '1s', duration: '16s' },
    { left: '63%', size: 7, delay: '8s', duration: '13s' },
    { left: '77%', size: 14, delay: '4s', duration: '20s' },
    { left: '90%', size: 9, delay: '2s', duration: '15s' },
  ]
  return (
    <div className="ocean-stage" aria-hidden="true">
      <div className="ocean-aurora a" />
      <div className="ocean-aurora b" />
      <div className="ocean-aurora c" />
      {bubbles.map((bubble, index) => (
        <span
          key={index}
          className="bubble"
          style={{ left: bubble.left, width: bubble.size, height: bubble.size, animationDelay: bubble.delay, animationDuration: bubble.duration }}
        />
      ))}
      <div className="ocean-waves" />
    </div>
  )
}

function PageIntro({ title, copy, action }) {
  return (
    <div className="page-enter mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="m-0 text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
        <p className="mb-0 mt-2 max-w-2xl text-sm text-muted">{copy}</p>
      </div>
      {action}
    </div>
  )
}

function ScanWorkspace({ result, onResult, onError }) {
  return (
    <div className="mx-auto max-w-[1180px]">
      <PageIntro title="New Marine Scan" copy="Upload a sonar image for enhanced grayscale processing and underwater hazard detection — wreckage, debris fields, and structural anomalies." />
      <div className="page-enter-delay grid gap-5 xl:grid-cols-[.9fr_1.35fr]">
        <UploadPanel onResult={onResult} onError={onError} />
        <DetectionViewer result={result} onUpdated={onResult} />
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [online, setOnline] = useState(false)
  const [model, setModel] = useState(null)
  const [scanCount, setScanCount] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('marinevision_theme') !== 'light')

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', darkMode)
    localStorage.setItem('marinevision_theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    if (!localStorage.getItem('marinevision_token')) { setAuthReady(true); return }
    getMe().then(setUser).catch(() => localStorage.removeItem('marinevision_token')).finally(() => setAuthReady(true))
  }, [])

  useEffect(() => {
    const ping = () => checkHealth().then(data => { setOnline(true); setModel(data.model) }).catch(() => { setOnline(false); setModel(null) })
    ping()
    const interval = setInterval(ping, 8000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => { if (user) getStats().then(data => setScanCount(data.total_scans || 0)).catch(() => setScanCount(0)) }, [refreshKey, user])

  useEffect(() => {
    if (!error) return undefined
    const timeout = setTimeout(() => setError(''), 4500)
    return () => clearTimeout(timeout)
  }, [error])

  const handleResult = scan => { setResult(scan); setRefreshKey(key => key + 1); setTab('scan'); setChatOpen(true) }
  const openHistoryScan = scan => { setResult(scan); setTab('scan') }
  const openScan = id => getScanDetail(id).then(openHistoryScan).catch(() => setError('The selected scan result could not be loaded.'))
  const newScan = () => setTab('scan')
  const onAuthenticated = data => { localStorage.setItem('marinevision_token', data.access_token); setUser(data.user) }
  const signOut = () => { localStorage.removeItem('marinevision_token'); setUser(null); setResult(null) }
  const healthy = online && model?.state !== 'error' && model?.state !== 'missing'
  const modelText = !online ? 'System offline' : healthy ? 'System online' : 'System needs attention'

  if (!authReady) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#041018] text-white">
        <OceanBackdrop />
        <div className="relative z-10 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-pulseGlow rounded-full border border-cyan-300/40 bg-cyan-400/10" />
          <p className="font-display text-lg font-bold">Loading secure workspace…</p>
        </div>
      </div>
    )
  }
  if (!user) return <LoginPage onAuthenticated={onAuthenticated} />

  const navigation = user.role === 'admin' ? [...navGroups, { label: 'Administration', links: [{ id: 'admin', name: 'Admin Console', icon: 'settings' }] }] : navGroups

  return (
    <div className="relative min-h-screen text-ink lg:flex">
      <OceanBackdrop />
      <aside className="glass-nav relative z-20 text-white lg:fixed lg:inset-y-0 lg:w-60 lg:border-r lg:border-cyan-200/10">
        <div className="flex h-full flex-col px-3 py-5">
          <div className="mb-6 flex items-center gap-3 px-2">
            <div className="grid h-11 w-11 animate-float place-items-center rounded-2xl border border-cyan-200/30 bg-gradient-to-br from-cyan-400/30 to-teal-500/20 text-lg shadow-glow">⚓</div>
            <div>
              <p className="m-0 font-display text-base font-extrabold tracking-tight">MarineVision</p>
              <p className="m-0 text-[9px] font-bold uppercase tracking-[.16em] text-cyan-200/70">Ocean intelligence</p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto lg:block lg:overflow-visible">
            {navigation.map(group => (
              <div key={group.label} className="mb-5 shrink-0">
                <p className="mb-2 hidden px-2 text-[9px] font-bold uppercase tracking-[.16em] text-cyan-200/45 lg:block">{group.label}</p>
                {group.links.map(link => (
                  <button
                    key={link.id}
                    onClick={() => setTab(link.id)}
                    className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition ${tab === link.id ? 'bg-gradient-to-r from-cyan-400/25 to-teal-400/10 font-bold text-white ring-1 ring-inset ring-cyan-200/30' : 'text-cyan-100/75 hover:bg-white/10 hover:text-white'}`}
                  >
                    <Icon name={link.icon} className="h-4 w-4" />
                    <span>{link.name}</span>
                    {link.badge && scanCount > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-cyan-400 px-1 text-[9px] font-bold text-slate-950">{scanCount > 99 ? '99+' : scanCount}</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="mt-auto hidden lg:block">
            <div className="mb-3 flex items-center justify-between rounded-2xl border border-cyan-200/10 bg-white/5 p-3">
              <div>
                <p className="m-0 text-[8px] font-bold uppercase tracking-wide text-cyan-200/70">Workspace status</p>
                <p className="mb-0 mt-1 flex items-center gap-1.5 text-[11px] text-cyan-50">
                  <i className={`h-1.5 w-1.5 rounded-full ${healthy ? 'bg-emerald-300' : 'bg-rose-300'}`} />
                  {modelText}
                </p>
              </div>
              <button title="Toggle color mode" aria-label="Toggle color mode" onClick={() => setDarkMode(value => !value)} className={`grid h-9 w-9 place-items-center rounded-xl border transition ${darkMode ? 'border-cyan-200/40 bg-cyan-300/20 text-cyan-100' : 'border-white/15 bg-white/10 text-sky-100 hover:bg-white/20'}`}>
                <Icon name="droplet" className="h-4 w-4" />
              </button>
            </div>
            <button onClick={newScan} className="action w-full gap-2 text-[12px]"><Icon name="plus" className="h-3.5 w-3.5" />New Scan</button>
            <button onClick={() => setChatOpen(true)} className="action-secondary mt-2 w-full gap-2 border-cyan-200/15 text-[12px] text-cyan-50">
              <Icon name="chat" className="h-3.5 w-3.5" />Ask AI assistant
            </button>
            <div className="mt-4 border-t border-cyan-100/10 px-1 pt-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-[10px] font-bold text-slate-950">{user.full_name.slice(0, 2).toUpperCase()}</span>
                <div>
                  <p className="m-0 text-[11px] font-bold">{user.full_name}</p>
                  <p className="m-0 text-[9px] capitalize text-cyan-200/70">{user.role}</p>
                </div>
              </div>
              <button onClick={signOut} className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-cyan-100/15 px-2 py-2 text-[10px] text-cyan-100/80 hover:bg-white/10">
                <Icon name="signout" className="h-3 w-3" />Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>
      <main className="relative z-10 min-w-0 flex-1 lg:ml-60">
        <header className="workspace-header border-b border-line px-5 py-3.5 lg:px-7">
          <p className="m-0 text-[11px] text-muted">
            <span>MarineVision</span>
            <span className="mx-2 opacity-40">/</span>
            <span className="font-semibold text-ink">{pageNames[tab]}</span>
          </p>
        </header>
        <div className="p-5 lg:p-8">
          {tab === 'dashboard' && <Dashboard refreshKey={refreshKey} onNewScan={newScan} onViewHistory={() => setTab('history')} onOpenScan={openScan} />}
          {tab === 'scan' && <ScanWorkspace result={result} onResult={handleResult} onError={setError} />}
          {tab === 'history' && (
            <div className="mx-auto max-w-[1080px]">
              <PageIntro title="Scan History" copy="Browse, review, and manage all processed sonar disaster and hazard scans." />
              <div className="page-enter-delay"><HistoryTable refreshKey={refreshKey} onSelect={openHistoryScan} /></div>
            </div>
          )}
          {tab === 'analytics' && <Analytics refreshKey={refreshKey} />}
          {tab === 'reports' && <Reports refreshKey={refreshKey} />}
          {tab === 'settings' && <Settings />}
          {tab === 'admin' && user.role === 'admin' && <AdminPage />}
        </div>
      </main>
      <MarineChatbot currentScanData={result} open={chatOpen} onOpenChange={setChatOpen} />
      {error && <div role="alert" className="fixed bottom-5 left-5 z-30 max-w-sm rounded-2xl border border-rose-300/40 bg-[var(--surface)] px-4 py-3 text-sm text-ink shadow-panel backdrop-blur-xl"><span className="mr-2 font-black text-rose-400">!</span>{error}</div>}
    </div>
  )
}
