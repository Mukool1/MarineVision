import { useState } from 'react'
import { login, register } from '../api/api'
import Icon from './Icon'

function OceanBackdrop() {
  return (
    <div className="ocean-stage" aria-hidden="true">
      <div className="ocean-aurora a" />
      <div className="ocean-aurora b" />
      <div className="ocean-aurora c" />
      <div className="ocean-waves" />
    </div>
  )
}

export default function LoginPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const signingIn = mode === 'login'

  const submit = async event => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      onAuthenticated(await (signingIn ? login(email, password) : register(name, email, password)))
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to authenticate. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#041018] px-5 py-10 text-white">
      <OceanBackdrop />
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1100px] items-center gap-12 lg:grid-cols-[1.05fr_.9fr]">
        <section className="page-enter max-w-[540px] lg:pl-8">
          <span className="grid h-14 w-14 animate-float place-items-center rounded-3xl border border-cyan-200/30 bg-cyan-400/10 text-cyan-200 shadow-glow">
            <Icon name="droplet" className="h-7 w-7" />
          </span>
          <p className="mb-0 mt-7 text-[11px] font-bold uppercase tracking-[.22em] text-cyan-200/80">MarineVision platform</p>
          <h1 className="mb-0 mt-4 max-w-lg font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">See the ocean. Act before it breaks.</h1>
          <p className="mb-0 mt-5 max-w-md text-sm leading-7 text-cyan-100/70">Secure sonar intelligence for debris, wreckage, and underwater hazards — with an AI assistant that turns detections into field-ready next steps.</p>
          <div className="mt-10 flex gap-8 text-[10px] font-bold uppercase tracking-[.14em] text-cyan-200/60">
            <span>Live sonar AI</span>
            <span>Secure access</span>
            <span>Cleanup ready</span>
          </div>
        </section>
        <section className="page-enter-delay w-full rounded-3xl border border-cyan-200/15 bg-white/10 p-7 text-white shadow-2xl shadow-cyan-950/40 backdrop-blur-2xl sm:p-8">
          <p className="m-0 text-[10px] font-bold uppercase tracking-[.18em] text-cyan-200/80">Secure access</p>
          <h2 className="mb-0 mt-3 font-display text-2xl font-extrabold tracking-tight">{signingIn ? 'Sign in to MarineVision' : 'Create your account'}</h2>
          <p className="mb-0 mt-2 text-xs leading-5 text-cyan-100/60">{signingIn ? 'Your account keeps every survey and review connected.' : 'Set up your private operator profile in a few moments.'}</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {!signingIn && <label><span className="field-label text-cyan-100/70">Full name</span><input required className="field-input border-cyan-200/15 bg-white/5 text-white" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></label>}
            <label><span className="field-label text-cyan-100/70">Email</span><input required type="email" className="field-input border-cyan-200/15 bg-white/5 text-white" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
            <label><span className="field-label text-cyan-100/70">Password</span><input required minLength="8" type="password" className="field-input border-cyan-200/15 bg-white/5 text-white" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" /></label>
            {error && <p role="alert" className="m-0 rounded-xl bg-rose-500/15 p-3 text-xs text-rose-200">{error}</p>}
            <button disabled={loading} className="action w-full" type="submit">{loading ? 'Please wait…' : signingIn ? 'Enter the command deck' : 'Create account'}</button>
          </form>
          <p className="mb-0 mt-6 text-center text-xs text-cyan-100/60">
            {signingIn ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={() => { setMode(signingIn ? 'register' : 'login'); setError('') }} className="font-bold text-cyan-200">{signingIn ? 'Create one' : 'Sign in'}</button>
          </p>
        </section>
      </div>
    </main>
  )
}
