import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { login, register, requestPasswordReset, resetPassword } from '../../api/api'
import { Icon } from '../ui'

const chips = [
  { icon: 'radar', stat: '12k+', label: 'Sonar frames analyzed' },
  { icon: 'pulse', stat: '94%', label: 'Detection accuracy' },
  { icon: 'shield', stat: '24/7', label: 'Ocean surveillance' },
]

/** Reset links land here as /#reset?token=… — pick the token out of the hash. */
const resetTokenFromHash = () => {
  const hash = window.location.hash || ''
  if (!hash.startsWith('#reset')) return null
  return new URLSearchParams(hash.split('?')[1] || '').get('token')
}

const copy = {
  login: {
    title: 'Sign in to MarineVision',
    sub: 'Your account keeps every survey and review connected.',
  },
  register: {
    title: 'Create your account',
    sub: 'Set up your private operator profile in a few moments.',
  },
  forgot: {
    title: 'Forgot your password?',
    sub: "Enter your account email and we'll send you a reset link.",
  },
  reset: {
    title: 'Choose a new password',
    sub: 'Pick a strong password — 8 characters or more.',
  },
}

export default function LoginPage({ onAuthenticated, onBack }) {
  const [mode, setMode] = useState('login') // login | register | forgot | reset
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [resetToken, setResetToken] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const signingIn = mode === 'login'

  useEffect(() => {
    const token = resetTokenFromHash()
    if (token) {
      setResetToken(token)
      setMode('reset')
      // Drop the token from the address bar so it can't leak via history/sharing.
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  const goMode = (next) => {
    setMode(next)
    setError('')
    setNotice('')
  }

  const submitAuth = async (event) => {
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

  const submitForgot = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setNotice('Reset link sent. Check your inbox — the link expires in 30 minutes.')
    } catch {
      setError('Could not send the reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const submitReset = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await resetPassword(resetToken, password)
      setNotice('Password updated. You can sign in with your new password now.')
      setPassword('')
      setConfirm('')
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'This reset link is invalid or has expired. Request a new one.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen bg-[#030b12] text-slate-100">
      {/* ---------- left brand panel ---------- */}
      <section className="relative hidden w-[46%] overflow-hidden lg:block" aria-hidden="true">
        <motion.img
          src="/img/hero-sonar.webp"
          alt=""
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030b12]/70 via-[#030b12]/30 to-[#030b12]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030b12]/90 via-transparent to-[#030b12]/40" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="ring-conic absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 animate-sweep opacity-30" />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          <motion.button
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            onClick={onBack}
            className="group inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur-xl transition hover:border-cyan-300/40 hover:text-cyan-200"
          >
            <Icon name="arrow" className="h-3.5 w-3.5 rotate-180 transition-transform group-hover:-translate-x-0.5" />
            Back to site
          </motion.button>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="grid h-14 w-14 animate-float place-items-center rounded-3xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-200 shadow-glow">
                <Icon name="droplet" className="h-7 w-7" />
              </span>
              <p className="mb-0 mt-7 text-[11px] font-bold uppercase tracking-[.24em] text-cyan-300/80">
                MarineVision command deck
              </p>
              <h1 className="mb-0 mt-4 font-display text-5xl font-extrabold leading-[1.04] tracking-tight xl:text-6xl">
                See the ocean.
                <br />
                <span className="text-gradient">Act before it breaks.</span>
              </h1>
              <p className="mb-0 mt-5 max-w-md text-sm leading-7 text-slate-300/80">
                Secure sonar intelligence for debris, wreckage, and underwater hazards — with an AI
                assistant that turns detections into field-ready next steps.
              </p>
            </motion.div>

            <div className="mt-10 flex flex-wrap gap-3">
              {chips.map((chip, i) => (
                <motion.div
                  key={chip.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.45 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="glass flex items-center gap-3 rounded-2xl px-4 py-3"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
                    <Icon name={chip.icon} className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-display text-base font-bold text-slate-100">{chip.stat}</span>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {chip.label}
                    </span>
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- right form panel ---------- */}
      <section className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -left-24 bottom-1/4 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
        </div>

        <button
          onClick={onBack}
          className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur-xl transition hover:border-cyan-300/40 hover:text-cyan-200 lg:hidden"
        >
          <Icon name="arrow" className="h-3.5 w-3.5 rotate-180" />
          Back to site
        </button>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="glass relative z-10 w-full max-w-md rounded-3xl p-7 shadow-card sm:p-9"
        >
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-200">
              <Icon name="droplet" className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-slate-100">
              Marine<span className="text-gradient">Vision</span>
            </span>
          </div>

          <p className="eyebrow">Secure access</p>
          <h2 className="mb-0 mt-1 font-display text-2xl font-bold tracking-tight text-slate-100">
            {copy[mode].title}
          </h2>
          <p className="mb-0 mt-2 text-xs leading-5 text-slate-400">{copy[mode].sub}</p>

          {(mode === 'login' || mode === 'register') && (
            <form onSubmit={submitAuth} className="mt-7 space-y-4">
              {mode === 'register' && (
                <motion.label
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="block overflow-hidden"
                >
                  <span className="field-label">Full name</span>
                  <input
                    required
                    className="field-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </motion.label>
              )}
              <label className="block">
                <span className="field-label">Email</span>
                <input
                  required
                  type="email"
                  className="field-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label className="block">
                <span className="flex items-center justify-between">
                  <span className="field-label">Password</span>
                  {signingIn && (
                    <button
                      type="button"
                      onClick={() => goMode('forgot')}
                      className="text-[11px] font-semibold text-cyan-300/80 transition hover:text-cyan-200"
                    >
                      Forgot password?
                    </button>
                  )}
                </span>
                <input
                  required
                  minLength="8"
                  type="password"
                  className="field-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                />
              </label>
              {error && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="m-0 rounded-xl border border-rose-300/25 bg-rose-400/10 p-3 text-xs leading-5 text-rose-200"
                >
                  {error}
                </motion.p>
              )}
              <button disabled={loading} className="action w-full" type="submit">
                {loading ? 'Please wait…' : signingIn ? 'Enter the command deck' : 'Create account'}
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={submitForgot} className="mt-7 space-y-4">
              <label className="block">
                <span className="field-label">Account email</span>
                <input
                  required
                  type="email"
                  className="field-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              {notice && (
                <motion.p
                  role="status"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="m-0 rounded-xl border border-emerald-300/25 bg-emerald-400/10 p-3 text-xs leading-5 text-emerald-200"
                >
                  {notice}
                </motion.p>
              )}
              {error && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="m-0 rounded-xl border border-rose-300/25 bg-rose-400/10 p-3 text-xs leading-5 text-rose-200"
                >
                  {error}
                </motion.p>
              )}
              <button disabled={loading} className="action w-full" type="submit">
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={submitReset} className="mt-7 space-y-4">
              <label className="block">
                <span className="field-label">New password</span>
                <input
                  required
                  minLength="8"
                  type="password"
                  className="field-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </label>
              <label className="block">
                <span className="field-label">Confirm new password</span>
                <input
                  required
                  minLength="8"
                  type="password"
                  className="field-input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat the new password"
                />
              </label>
              {notice && (
                <motion.p
                  role="status"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="m-0 rounded-xl border border-emerald-300/25 bg-emerald-400/10 p-3 text-xs leading-5 text-emerald-200"
                >
                  {notice}
                </motion.p>
              )}
              {error && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="m-0 rounded-xl border border-rose-300/25 bg-rose-400/10 p-3 text-xs leading-5 text-rose-200"
                >
                  {error}
                </motion.p>
              )}
              <button disabled={loading} className="action w-full" type="submit">
                {loading ? 'Updating…' : 'Set new password'}
              </button>
            </form>
          )}

          <p className="mb-0 mt-6 text-center text-xs text-slate-400">
            {mode === 'forgot' || mode === 'reset' ? (
              <>
                Remembered it?{' '}
                <button
                  onClick={() => goMode('login')}
                  className="font-bold text-cyan-300 transition hover:text-cyan-200"
                >
                  Back to sign in
                </button>
              </>
            ) : (
              <>
                {signingIn ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  onClick={() => goMode(signingIn ? 'register' : 'login')}
                  className="font-bold text-cyan-300 transition hover:text-cyan-200"
                >
                  {signingIn ? 'Create one' : 'Sign in'}
                </button>
              </>
            )}
          </p>
        </motion.div>
      </section>
    </main>
  )
}
