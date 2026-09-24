import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from './components/landing/LandingPage'
import LoginPage from './components/app/LoginPage'
import Dashboard from './components/app/Dashboard'
import NewScan from './components/app/NewScan'
import History from './components/app/History'
import Reports from './components/app/Reports'
import Analytics from './components/app/Analytics'
import Settings from './components/app/Settings'
import AdminPage from './components/app/AdminPage'
import SurveyMap from './components/app/SurveyMap'
import MarineChatbot from './components/app/MarineChatbot'
import { Bubbles, Icon } from './components/ui'
import { checkHealth, getMe, getScanDetail, getStats } from './api/api'

const navGroups = [
  {
    label: 'Operations',
    links: [
      { id: 'dashboard', name: 'Dashboard', icon: 'dashboard' },
      { id: 'scan', name: 'New Scan', icon: 'upload' },
      { id: 'map', name: 'Survey Map', icon: 'map' },
      { id: 'history', name: 'Scan History', icon: 'history', badge: true },
    ],
  },
  {
    label: 'Records & Reporting',
    links: [
      { id: 'reports', name: 'Incident Reports', icon: 'report' },
      { id: 'analytics', name: 'Analytics', icon: 'analytics' },
    ],
  },
  {
    label: 'System',
    links: [{ id: 'settings', name: 'Settings', icon: 'settings' }],
  },
]

const pageNames = {
  dashboard: 'Dashboard Overview',
  scan: 'New Marine Scan',
  map: 'Survey Map',
  history: 'Scan History',
  reports: 'Incident Reports',
  analytics: 'Monitoring Analytics',
  settings: 'Settings',
  admin: 'Administration',
}

function BootSplash() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#030b12] text-white">
      <Bubbles count={12} />
      <div className="relative z-10 text-center">
        <div className="relative mx-auto mb-6 h-16 w-16">
          <div className="absolute inset-0 animate-ping-slow rounded-full border border-cyan-300/50" />
          <div className="absolute inset-0 rounded-full border border-cyan-300/40 bg-cyan-400/10" />
          <div className="absolute inset-0"><div className="ring-conic h-full w-full animate-sweep" /></div>
        </div>
        <p className="m-0 font-display text-lg font-bold">Establishing sonar link…</p>
        <p className="m-0 mt-1 font-mono text-[11px] uppercase tracking-[.25em] text-cyan-300/60">MarineVision</p>
      </div>
    </div>
  )
}

function Sidebar({ tab, setTab, user, healthy, modelText, scanCount, newScan, openChat, signOut, navigation }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-[#04121c]/85 px-4 py-6 backdrop-blur-2xl lg:flex">
      <button onClick={() => setTab('dashboard')} className="mb-8 flex items-center gap-3 px-2 text-left">
        <span className="relative grid h-11 w-11 place-items-center">
          <span className="absolute inset-0 animate-float rounded-2xl bg-cyan-400/20 blur-md" />
          <svg viewBox="0 0 32 32" className="relative h-10 w-10">
            <circle cx="16" cy="16" r="13" fill="#04121c" stroke="#22d3ee" strokeWidth="2" />
            <path d="M16 16 L16 5 A11 11 0 0 1 24 8 Z" fill="#22d3ee" opacity="0.9" />
            <circle cx="16" cy="16" r="3" fill="#22d3ee" />
          </svg>
        </span>
        <span>
          <span className="block font-display text-base font-bold tracking-tight text-slate-100">
            Marine<span className="text-gradient">Vision</span>
          </span>
          <span className="block text-[9px] font-bold uppercase tracking-[.2em] text-cyan-300/60">Ocean intelligence</span>
        </span>
      </button>

      <nav className="flex-1 space-y-6 overflow-y-auto">
        {navigation.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[.2em] text-slate-500">{group.label}</p>
            {group.links.map((link) => {
              const active = tab === link.id
              return (
                <button
                  key={link.id}
                  onClick={() => setTab(link.id)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition-all duration-300 ${
                    active
                      ? 'bg-gradient-to-r from-cyan-400/25 to-teal-400/10 font-bold text-white shadow-glow ring-1 ring-inset ring-cyan-300/30'
                      : 'text-slate-400 hover:bg-white/[.06] hover:text-slate-100'
                  }`}
                >
                  <Icon name={link.icon} className={`h-4 w-4 ${active ? 'text-cyan-300' : ''}`} />
                  <span className="flex-1">{link.name}</span>
                  {link.badge && scanCount > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-cyan-400 px-1.5 text-[10px] font-bold text-[#03202b]">
                      {scanCount > 99 ? '99+' : scanCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.04] p-3">
          <div>
            <p className="m-0 text-[9px] font-bold uppercase tracking-widest text-slate-500">Workspace status</p>
            <p className="mb-0 mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-200">
              <span className={`h-1.5 w-1.5 rounded-full ${healthy ? 'animate-blink bg-emerald-300' : 'bg-rose-400'}`} />
              {modelText}
            </p>
          </div>
        </div>
        <button onClick={newScan} className="action w-full !py-2.5 text-xs">
          <Icon name="plus" className="h-3.5 w-3.5" /> New Scan
        </button>
        <button onClick={openChat} className="action-secondary w-full !py-2.5 text-xs">
          <Icon name="chat" className="h-3.5 w-3.5" /> Ask AI assistant
        </button>
        <div className="flex items-center gap-2.5 border-t border-white/10 px-1 pt-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-[11px] font-bold text-[#03202b]">
            {user.full_name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-xs font-bold text-slate-100">{user.full_name}</p>
            <p className="m-0 text-[10px] capitalize text-slate-500">{user.role}</p>
          </div>
          <button onClick={signOut} title="Sign out" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-rose-300">
            <Icon name="logout" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

function MobileNav({ tab, setTab }) {
  const items = [
    { id: 'dashboard', icon: 'dashboard', label: 'Home' },
    { id: 'scan', icon: 'upload', label: 'Scan' },
    { id: 'map', icon: 'map', label: 'Map' },
    { id: 'history', icon: 'history', label: 'History' },
    { id: 'reports', icon: 'report', label: 'Reports' },
    { id: 'analytics', icon: 'analytics', label: 'Stats' },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#04121c]/92 px-2 py-2 backdrop-blur-2xl lg:hidden">
      <div className="flex">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[9px] font-bold uppercase tracking-wider transition ${
              tab === item.id ? 'text-cyan-300' : 'text-slate-500'
            }`}
          >
            <Icon name={item.icon} className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

export default function App() {
  const [screen, setScreen] = useState('boot') // boot | site | auth | app
  const [tab, setTab] = useState('dashboard')
  const [mapFocus, setMapFocus] = useState(null)
  const [online, setOnline] = useState(false)
  const [model, setModel] = useState(null)
  const [scanCount, setScanCount] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [user, setUser] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    // A password-reset link should open the reset form immediately, not the
    // landing page — LoginPage reads the token from the URL hash on mount.
    if ((window.location.hash || '').startsWith('#reset')) {
      setScreen('auth')
      return
    }
    if (!localStorage.getItem('marinevision_token')) {
      setScreen('site')
      return
    }
    getMe()
      .then((u) => {
        setUser(u)
        setScreen('app')
      })
      .catch(() => {
        localStorage.removeItem('marinevision_token')
        setScreen('site')
      })
  }, [])

  useEffect(() => {
    const ping = () =>
      checkHealth()
        .then((data) => {
          setOnline(true)
          setModel(data.model)
        })
        .catch(() => {
          setOnline(false)
          setModel(null)
        })
    ping()
    const interval = setInterval(ping, 8000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (user && screen === 'app')
      getStats()
        .then((data) => setScanCount(data.total_scans || 0))
        .catch(() => setScanCount(0))
  }, [refreshKey, user, screen])

  useEffect(() => {
    if (!error) return undefined
    const t = setTimeout(() => setError(''), 5000)
    return () => clearTimeout(t)
  }, [error])

  const handleResult = (scan) => {
    setResult(scan)
    setRefreshKey((k) => k + 1)
    setTab('scan')
    setChatOpen(true)
  }
  const openHistoryScan = (scan) => {
    setResult(scan)
    setTab('scan')
  }
  const openScan = (id) =>
    getScanDetail(id)
      .then(openHistoryScan)
      .catch(() => setError('The selected scan result could not be loaded.'))
  const newScan = () => setTab('scan')
  const onAuthenticated = (data) => {
    localStorage.setItem('marinevision_token', data.access_token)
    setUser(data.user)
    setScreen('app')
    setTab('dashboard')
  }
  const signOut = () => {
    localStorage.removeItem('marinevision_token')
    setUser(null)
    setResult(null)
    setScreen('site')
  }
  const healthy = online && model?.state !== 'error' && model?.state !== 'missing'
  const modelText = !online ? 'System offline' : healthy ? 'System online' : 'Needs attention'

  if (screen === 'boot') return <BootSplash />
  if (screen === 'site') return <LandingPage onLaunch={() => setScreen('auth')} />
  if (screen === 'auth' && !user)
    return <LoginPage onAuthenticated={onAuthenticated} onBack={() => setScreen('site')} />

  const navigation =
    user?.role === 'admin'
      ? [...navGroups, { label: 'Administration', links: [{ id: 'admin', name: 'Admin Console', icon: 'users' }] }]
      : navGroups

  return (
    <div className="relative min-h-screen bg-[#030b12] text-slate-200">
      <Bubbles count={8} className="fixed" />
      <Sidebar
        tab={tab}
        setTab={setTab}
        user={user}
        healthy={healthy}
        modelText={modelText}
        scanCount={scanCount}
        newScan={newScan}
        openChat={() => setChatOpen(true)}
        signOut={signOut}
        navigation={navigation}
      />
      <MobileNav tab={tab} setTab={setTab} />

      <main className="relative z-10 min-w-0 pb-24 lg:ml-64 lg:pb-0">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#030b12]/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-5 py-4 lg:px-8">
            <p className="m-0 text-xs text-slate-500">
              <span className="font-semibold text-slate-300">MarineVision</span>
              <span className="mx-2 opacity-40">/</span>
              <span className="font-display font-bold text-slate-100">{pageNames[tab]}</span>
            </p>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${
                  healthy ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-300' : 'border-rose-300/25 bg-rose-400/10 text-rose-300'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${healthy ? 'animate-blink bg-emerald-300' : 'bg-rose-400'}`} />
                {healthy ? 'Link stable' : 'Offline'}
              </span>
              <button onClick={signOut} className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-white/10 hover:text-rose-300 lg:hidden" title="Sign out">
                <Icon name="logout" className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="px-5 py-6 lg:px-8 lg:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {tab === 'dashboard' && (
                <Dashboard
                  refreshKey={refreshKey}
                  onNewScan={newScan}
                  onViewHistory={() => setTab('history')}
                  onOpenScan={openScan}
                />
              )}
              {tab === 'scan' && <NewScan result={result} onResult={handleResult} onError={setError} onViewMap={(id) => { setMapFocus(id); setTab('map') }} />}
              {tab === 'map' && <SurveyMap onOpenScan={openScan} focusScanId={mapFocus} onFocusConsumed={() => setMapFocus(null)} />}
              {tab === 'history' && <History refreshKey={refreshKey} onSelect={openHistoryScan} />}
              {tab === 'reports' && <Reports refreshKey={refreshKey} />}
              {tab === 'analytics' && <Analytics refreshKey={refreshKey} />}
              {tab === 'settings' && <Settings />}
              {tab === 'admin' && user?.role === 'admin' && <AdminPage />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <MarineChatbot currentScanData={result} open={chatOpen} onOpenChange={setChatOpen} />

      <AnimatePresence>
        {error && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="fixed bottom-20 left-5 z-40 max-w-sm rounded-2xl border border-rose-300/30 bg-[#0a1a26]/95 px-4 py-3 text-sm text-slate-100 shadow-glow backdrop-blur-xl lg:bottom-5"
          >
            <span className="mr-2 font-black text-rose-400">!</span>
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
