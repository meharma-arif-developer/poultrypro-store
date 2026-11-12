import { useState } from 'react'
import { Handshake, Package, Store } from 'lucide-react'
import { api } from '../api'

const POINTS = [
  [Package, 'Bulk and wholesale orders', 'Special rates for large farms and regular buyers.'],
  [Store, 'Dealerships and resellers', 'Sell our products in your area.'],
  [Handshake, 'Farm partnerships', 'Supply deals, training and joint projects.'],
]

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '', website: '' })
  const [state, setState] = useState('idle') // idle | busy | sent
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const field = 'h-12 w-full rounded-lg border border-slate-300 px-3 text-base text-ink'

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setState('busy')
    try { await api.post('/messages', form); setState('sent') } catch (err) { setError(err.message); setState('idle') }
  }

  return (
    <section id="collaborate" className="scroll-mt-20 bg-ink px-4 py-16 text-white sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Let&rsquo;s collaborate</h2>
          <p className="mt-3 max-w-md text-lg text-slate-200">Have a bigger plan or a question? Send us a message and we will reply by email.</p>
          <ul className="mt-8 space-y-5">
            {POINTS.map(([Icon, title, text]) => (
              <li key={title} className="flex gap-4">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-panel"><Icon className="h-5 w-5 text-volt" /></div>
                <div><div className="font-semibold">{title}</div><div className="text-sm text-slate-300">{text}</div></div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-white p-6 text-ink">
          {state === 'sent' ? (
            <div className="py-10 text-center"><h3 className="font-display text-2xl font-bold">Thank you!</h3><p className="mt-2 text-slate-600">We received your message and will reply to your email soon.</p>
              <button onClick={() => { setForm({ name: '', email: '', message: '', website: '' }); setState('idle') }} className="mt-5 min-h-[44px] rounded-xl border border-slate-300 px-5 font-semibold">Send another message</button></div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <label className="block text-sm font-semibold" htmlFor="ctn">Your name</label>
              <input id="ctn" className={field} autoComplete="name" value={form.name} onChange={set('name')} />
              <label className="block text-sm font-semibold" htmlFor="cte">Email</label>
              <input id="cte" type="email" className={field} autoComplete="email" value={form.email} onChange={set('email')} />
              <label className="block text-sm font-semibold" htmlFor="ctm">Message</label>
              <textarea id="ctm" rows={4} maxLength={1500} className="w-full rounded-lg border border-slate-300 p-3 text-base" value={form.message} onChange={set('message')} />
              <input tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={form.website} onChange={set('website')} style={{ position: 'absolute', left: '-9999px' }} />
              {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
              <button disabled={state === 'busy'} className="min-h-[48px] w-full rounded-xl bg-ink font-bold text-white disabled:opacity-50">{state === 'busy' ? 'Sending...' : 'Send message'}</button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
