import { useState } from 'react'
import { CATEGORIES } from '../data/products'
import { STORE } from '../data/store'
import { Feather, Mail, Phone, MapPin, CreditCard } from 'lucide-react'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const submit = (e) => { e.preventDefault(); if (email) { setDone(true); setEmail('') } }
  const link = 'hover:text-volt'

  return (
    <footer className="bg-ink px-4 pb-6 pt-14 text-slate-300 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2 font-display text-2xl font-bold text-white"><Feather className="h-6 w-6 text-volt" />{STORE.name}</div>
          <p className="text-sm leading-relaxed">{STORE.tagline}</p>
          <form onSubmit={submit} className="mt-4 flex gap-2">
            <input type="email" aria-label="Email address" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email" className="h-11 min-w-0 flex-1 rounded-lg border border-slate-600 bg-panel px-3 text-sm text-white" />
            <button className="h-11 rounded-lg bg-volt px-4 font-bold text-ink">Subscribe</button>
          </form>
          {done && <p className="mt-2 text-sm text-volt">Thanks! You are subscribed.</p>}
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Quick links</h4>
          <ul className="space-y-2 text-sm">{['Offers', 'New stock', 'Track order', 'Returns'].map((l) => <li key={l}><a href="#top" className={link}>{l}</a></li>)}</ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Categories</h4>
          <ul className="space-y-2 text-sm">{CATEGORIES.map((l) => <li key={l}><a href="#shop" className={link}>{l}</a></li>)}</ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" />{STORE.email}</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" />{STORE.phone}</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" />{STORE.address}</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-slate-700 pt-5 text-sm">
        <span>&copy; 2026 {STORE.name}. All rights reserved.</span>
        <div className="flex items-center gap-2" aria-label="Accepted payment methods">
          <CreditCard className="h-5 w-5" />
          {['Cash on Delivery', 'Bank Transfer', 'JazzCash', 'Easypaisa'].map((p) => <span key={p} className="rounded border border-slate-600 px-2 py-1 text-xs font-bold">{p}</span>)}
        </div>
      </div>
    </footer>
  )
}
