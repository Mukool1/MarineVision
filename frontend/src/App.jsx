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
import Icon from './components/Icon'
import { checkHealth, getMe, getScanDetail, getStats } from './api/api'

const navGroups = [
  { label: 'Operations', links: [{ id: 'dashboard', name: 'Dashboard', icon: 'dashboard' }, { id: 'scan', name: 'New Scan', icon: 'upload' }, { id: 'history', name: 'Scan History', icon: 'history', badge: true }] },
  { label: 'Records & Reporting', links: [{ id: 'reports', name: 'Incident Reports', icon: 'report' }, { id: 'analytics', name: 'Analytics', icon: 'analytics' }] },
  { label: 'System', links: [{ id: 'settings', name: 'Settings', icon: 'settings' }] },
]

const pageNames = { dashboard: 'Dashboard Overview', scan: 'New Marine Scan', history: 'Scan History', reports: 'Incident Reports', analytics: 'Monitoring Analytics', settings: 'Settings', admin: 'Administration' }

function ScanWorkspace({ result, onResult, onError }) {
  return <div className="mx-auto max-w-[1180px]"><div className="mb-5"><h1 className="m-0 text-2xl font-bold tracking-tight text-[#073654]">New Marine Scan</h1><p className="mb-0 mt-1 text-xs text-slate-500">Upload a sonar image for enhanced grayscale processing and underwater hazard detection — wreckage, debris fields, and structural anomalies.</p></div><div className="grid gap-5 xl:grid-cols-[.9fr_1.35fr]"><UploadPanel onResult={onResult} onError={onError} /><DetectionViewer result={result} onUpdated={onResult} /></div></div>
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
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('marinevision_theme') === 'dark')

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

  const handleResult = scan => { setResult(scan); setRefreshKey(key => key + 1); setTab('scan') }
  const openHistoryScan = scan => { setResult(scan); setTab('scan') }
  const openScan = id => getScanDetail(id).then(openHistoryScan).catch(() => setError('The selected scan result could not be loaded.'))
  const newScan = () => setTab('scan')
  const onAuthenticated = data => { localStorage.setItem('marinevision_token', data.access_token); setUser(data.user) }
  const signOut = () => { localStorage.removeItem('marinevision_token'); setUser(null); setResult(null) }
  const modelText = !online ? 'System offline' : model?.state === 'error' || model?.state === 'missing' ? 'System needs attention' : 'System online'

  if (!authReady) return <div className="grid min-h-screen place-items-center bg-[#033553] text-white">Loading secure workspace…</div>
  if (!user) return <LoginPage onAuthenticated={onAuthenticated} />

  const navigation = user.role === 'admin' ? [...navGroups, { label: 'Administration', links: [{ id: 'admin', name: 'Admin Console', icon: 'settings' }] }] : navGroups

  return <div className="min-h-screen bg-[#f4f7fa] text-[#183b55] lg:flex">
    <aside className="bg-[#033553] text-white lg:fixed lg:inset-y-0 lg:w-52">
      <div className="flex h-full flex-col px-2.5 py-4">
        <div className="flex items-center gap-2.5 px-1 pb-4"><div className="grid h-8 w-8 place-items-center rounded-lg border border-sky-200/30 bg-[#17658a] text-lg leading-none">⚓</div><div><p className="m-0 text-sm font-extrabold tracking-tight">MarineVision</p><p className="m-0 text-[8px] font-bold uppercase tracking-[.1em] text-sky-200/80">Disaster &amp; hazard monitoring</p></div></div>
        <nav className="flex gap-1 overflow-x-auto lg:block lg:overflow-visible">{navigation.map(group => <div key={group.label} className="mb-4 shrink-0"><p className="mb-1.5 hidden px-2 text-[8px] font-bold uppercase tracking-[.12em] text-sky-300/55 lg:block">{group.label}</p>{group.links.map(link => <button key={link.id} onClick={() => setTab(link.id)} className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11px] transition ${tab === link.id ? 'bg-[#0b5f90] font-bold text-white ring-1 ring-inset ring-sky-300/30' : 'text-sky-100/75 hover:bg-white/10 hover:text-white'}`}><Icon name={link.icon} className="h-3.5 w-3.5" /><span>{link.name}</span>{link.badge && scanCount > 0 && <span className="ml-auto grid h-4 min-w-4 place-items-center rounded-full bg-[#2c8bb4] px-1 text-[8px] font-bold text-white">{scanCount > 99 ? '99+' : scanCount}</span>}</button>)}</div>)}</nav>
        <div className="mt-auto hidden lg:block"><div className="mb-3 flex items-center justify-between rounded-lg border border-sky-200/10 bg-white/5 p-2.5"><div><p className="m-0 text-[8px] font-bold uppercase tracking-wide text-sky-200/70">Workspace status</p><p className="mb-0 mt-1 flex items-center gap-1.5 text-[10px] text-sky-50"><i className={`h-1.5 w-1.5 rounded-full ${online && model?.state !== 'error' && model?.state !== 'missing' ? 'bg-emerald-300' : 'bg-rose-300'}`} />{modelText}</p></div><button title="Toggle color mode" aria-label="Toggle color mode" onClick={() => setDarkMode(value => !value)} className={`grid h-8 w-8 place-items-center rounded-lg border transition ${darkMode ? 'border-cyan-200/40 bg-cyan-300/20 text-cyan-100' : 'border-white/15 bg-white/10 text-sky-100 hover:bg-white/20'}`}><Icon name="droplet" className="h-4 w-4" /></button></div><button onClick={newScan} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2e88b1] px-3 py-2.5 text-[11px] font-bold transition hover:bg-[#47a1c8]"><Icon name="plus" className="h-3.5 w-3.5" />New Scan</button><div className="mt-3 border-t border-sky-100/10 px-1 pt-3"><div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#2d82a3] text-[9px] font-bold">{user.full_name.slice(0, 2).toUpperCase()}</span><div><p className="m-0 text-[10px] font-bold">{user.full_name}</p><p className="m-0 text-[8px] capitalize text-sky-200/70">{user.role}</p></div></div><button onClick={signOut} className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-sky-100/15 px-2 py-1.5 text-[9px] text-sky-100/80"><Icon name="signout" className="h-3 w-3" />Sign Out</button></div></div>
      </div>
    </aside>
    <main className="min-w-0 flex-1 lg:ml-52"><header className="workspace-header border-b border-slate-200 bg-white px-5 py-3 lg:px-6"><p className="m-0 text-[10px] text-slate-500"><span className="text-[#668197]">MarineVision</span><span className="mx-1.5 text-slate-300">/</span><span className="font-semibold text-[#31506a]">{pageNames[tab]}</span></p></header><div className="p-5 lg:p-7">{tab === 'dashboard' && <Dashboard refreshKey={refreshKey} onNewScan={newScan} onViewHistory={() => setTab('history')} onOpenScan={openScan} />}{tab === 'scan' && <ScanWorkspace result={result} onResult={handleResult} onError={setError} />}{tab === 'history' && <div className="mx-auto max-w-[1080px]"><div className="mb-5"><h1 className="m-0 text-2xl font-bold tracking-tight text-[#073654]">Scan History</h1><p className="mb-0 mt-1 text-xs text-slate-500">Browse, review, and manage all processed sonar disaster and hazard scans.</p></div><HistoryTable refreshKey={refreshKey} onSelect={openHistoryScan} /></div>}{tab === 'analytics' && <Analytics refreshKey={refreshKey} />}{tab === 'reports' && <Reports refreshKey={refreshKey} />}{tab === 'settings' && <Settings />}{tab === 'admin' && user.role === 'admin' && <AdminPage />}</div></main>
    {error && <div role="alert" className="fixed bottom-5 right-5 z-20 max-w-sm rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-[#553339] shadow-2xl"><span className="mr-2 font-black text-rose-500">!</span>{error}</div>}
  </div>
}
