import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { useConfig } from '../context/ConfigContext'

let gsiPromise
function loadGsi() {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (!gsiPromise) {
    gsiPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.onload = resolve
      s.onerror = () => { gsiPromise = null; reject(new Error('load')) }
      document.head.appendChild(s)
    })
  }
  return gsiPromise
}

export default function LoginModal({ open, onClose, onSuccess }) {
  const { login } = useAuth()
  const { googleClientId } = useConfig()
  const [mode, setMode] = useState('signin') // signin | signup | phone | code
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '', code: '' })
  const [isNew, setIsNew] = useState(false)
  const [devOtp, setDevOtp] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(0)
  const gRef = useRef(null)
  const doneRef = useRef()

  const done = (d) => { login(d.token, d.user); onClose(); onSuccess?.(d.user) }
  doneRef.current = done
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => { if (open) { setMode('signin'); setError(''); setDevOtp('') } }, [open])
  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait(wait - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  useEffect(() => {
    if (!open || !googleClientId || !['signin', 'signup'].includes(mode)) return
    let dead = false
    loadGsi().then(() => {
      if (dead || !gRef.current) return
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (resp) => {
          try { doneRef.current(await api.post('/auth/google', { credential: resp.credential })) } catch (e) { setError(e.message) }
        },
      })
      window.google.accounts.id.renderButton(gRef.current, { theme: 'outline', size: 'large', width: 320, text: 'continue_with' })
    }).catch(() => setError('Could not load Google. Check your internet connection.'))
    return () => { dead = true }
  }, [open, mode, googleClientId])

  if (!open) return null

  const run = (fn) => async (e) => {
    e?.preventDefault()
    setError(''); setBusy(true)
    try { await fn() } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const signin = run(async () => done(await api.post('/auth/login', { email: f.email, password: f.password })))
  const signup = run(async () => done(await api.post('/auth/signup', { name: f.name, email: f.email, password: f.password })))
  const sendCode = run(async () => {
    const d = await api.post('/auth/request-otp', { phone: f.phone })
    setIsNew(d.isNewUser); setDevOtp(d.devOtp || ''); setMode('code'); setWait(60)
  })
  const verify = run(async () => done(await api.post('/auth/verify-otp', { phone: f.phone, code: f.code, name: f.name })))

  const field = 'h-12 w-full rounded-lg border border-slate-300 px-3 text-base'
  const primary = 'min-h-[48px] w-full rounded-xl bg-ink font-bold text-white disabled:opacity-50'
  const link = 'min-h-[44px] font-semibold text-green-800'
  const Err = () => error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>
  const emailMode = mode === 'signin' || mode === 'signup'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-ink/60" onClick={onClose} />
      <div role="dialog" aria-label="Log in or sign up" className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <button aria-label="Close" onClick={onClose} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-lg"><X className="h-5 w-5" /></button>
        <h2 className="font-display text-2xl font-bold">{mode === 'signup' ? 'Create your account' : mode === 'signin' ? 'Welcome back' : mode === 'phone' ? 'Login with mobile' : 'Enter your code'}</h2>

        {emailMode && (
          <>
            <div className="mt-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold" role="tablist">
              {[['signin', 'Sign in'], ['signup', 'Sign up']].map(([m, label]) => (
                <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError('') }}
                  className={`min-h-[44px] rounded-lg ${mode === m ? 'bg-white shadow' : 'text-slate-600'}`}>{label}</button>
              ))}
            </div>
            {googleClientId && (
              <>
                <div className="mt-4 flex justify-center"><div ref={gRef} /></div>
                <div className="my-4 flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-slate-200" />or with email<span className="h-px flex-1 bg-slate-200" /></div>
              </>
            )}
            <form onSubmit={mode === 'signin' ? signin : signup} className="mt-4 space-y-3">
              {mode === 'signup' && (<><label className="block text-sm font-semibold" htmlFor="ln">Your name</label>
                <input id="ln" className={field} autoComplete="name" value={f.name} onChange={set('name')} /></>)}
              <label className="block text-sm font-semibold" htmlFor="le">Email</label>
              <input id="le" type="email" className={field} autoComplete="email" value={f.email} onChange={set('email')} />
              <label className="block text-sm font-semibold" htmlFor="lw">Password</label>
              <input id="lw" type="password" className={field} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={f.password} onChange={set('password')} />
              {mode === 'signup' && <p className="text-xs text-slate-600">At least 8 characters.</p>}
              <Err />
              <button disabled={busy} className={primary}>{busy ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
            </form>
            <button onClick={() => { setMode('phone'); setError('') }} className={link + ' mt-2 w-full text-sm'}>Use mobile number (OTP) instead</button>
          </>
        )}

        {mode === 'phone' && (
          <form onSubmit={sendCode} className="mt-4 space-y-3">
            <label className="block text-sm font-semibold" htmlFor="lp">Mobile number</label>
            <input id="lp" className={field} inputMode="tel" autoComplete="tel" placeholder="03001234567" value={f.phone} onChange={set('phone')} autoFocus />
            <p className="text-sm text-slate-600">We will send a 6-digit code by SMS.</p>
            <Err />
            <button disabled={busy} className={primary}>{busy ? 'Sending...' : 'Send code'}</button>
            <button type="button" onClick={() => { setMode('signin'); setError('') }} className={link + ' w-full text-sm'}>Back to email login</button>
          </form>
        )}

        {mode === 'code' && (
          <form onSubmit={verify} className="mt-4 space-y-3">
            <p className="text-sm text-slate-600">Code sent to {f.phone}.</p>
            {devOtp && <p className="rounded-lg bg-amber-100 p-3 text-sm text-amber-900">Test mode: your code is <b>{devOtp}</b></p>}
            <label className="block text-sm font-semibold" htmlFor="lc">6-digit code</label>
            <input id="lc" className={field + ' tracking-widest'} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.replace(/\D/g, '') })} autoFocus />
            {isNew && (<><label className="block text-sm font-semibold" htmlFor="lcn">Your name</label>
              <input id="lcn" className={field} autoComplete="name" value={f.name} onChange={set('name')} /></>)}
            <Err />
            <button disabled={busy || f.code.length !== 6} className={primary}>{busy ? 'Checking...' : 'Verify and continue'}</button>
            <div className="flex justify-between text-sm">
              <button type="button" onClick={() => setMode('phone')} className={link}>Change number</button>
              <button type="button" disabled={wait > 0 || busy} onClick={sendCode} className={link + ' disabled:text-slate-400'}>{wait > 0 ? `Resend in ${wait}s` : 'Resend code'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
