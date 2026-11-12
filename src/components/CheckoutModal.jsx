import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X, CheckCircle2 } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { useConfig } from '../context/ConfigContext'
import { money } from '../data/products'
import { calcTotals } from '../data/totals'
import { showPhone, fmtDay, daysFromNow } from '../data/format'

export default function CheckoutModal({ open, onClose, items, onPlaced }) {
  const { user } = useAuth()
  const { deliveryDays } = useConfig()
  const [form, setForm] = useState({ name: user?.name || '', phone: showPhone(user?.phone), email: user?.email || '', city: '', line: '', note: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [placed, setPlaced] = useState(null)

  if (!open) return null
  const t = calcTotals(items)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const field = 'h-12 w-full rounded-lg border border-slate-300 px-3 text-base'
  const estimate = `${fmtDay(daysFromNow(deliveryDays[0]))} to ${fmtDay(daysFromNow(deliveryDays[1]))}`

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const d = await api.post('/orders', { items: items.map((i) => ({ id: i.id, qty: i.qty })), address: form })
      setPlaced({ ...d.order, emailed: d.emailed })
      onPlaced()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const close = () => { setPlaced(null); onClose() }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/60" onClick={close} />
      <div role="dialog" aria-label="Checkout" className="relative max-h-full w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        <button aria-label="Close" onClick={close} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-lg"><X className="h-5 w-5" /></button>

        {placed ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
            <h2 className="mt-3 font-display text-2xl font-bold">Order placed!</h2>
            <p className="mt-2 text-slate-600">Your order number is <b className="text-ink">{placed.number}</b>. Please keep {money(placed.total)} ready for cash on delivery. We will call you to confirm.</p>
            <p className="mt-3 rounded-xl bg-green-50 p-3 text-sm"><b>Estimated delivery:</b> {fmtDay(placed.eta.from)} to {fmtDay(placed.eta.to)}</p>
            {placed.email && <p className="mt-3 text-sm text-slate-600">{placed.emailed ? `A confirmation email with all details was sent to ${placed.email}.` : `Order saved. Email: ${placed.email}`}</p>}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link to="/orders" className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-ink px-6 font-bold text-white">View my orders</Link>
              <button onClick={close} className="min-h-[48px] rounded-xl border border-slate-300 px-6 font-semibold">Keep shopping</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <h2 className="font-display text-2xl font-bold">Delivery details</h2>
            <label className="block text-sm font-semibold" htmlFor="cn">Receiver name</label>
            <input id="cn" className={field} autoComplete="name" value={form.name} onChange={set('name')} />
            <label className="block text-sm font-semibold" htmlFor="cp">Mobile number</label>
            <input id="cp" className={field} inputMode="tel" autoComplete="tel" placeholder="03001234567" value={form.phone} onChange={set('phone')} />
            <label className="block text-sm font-semibold" htmlFor="ce">Email (to receive your order confirmation)</label>
            <input id="ce" type="email" className={field} autoComplete="email" placeholder="optional" value={form.email} onChange={set('email')} />
            <label className="block text-sm font-semibold" htmlFor="cc">City</label>
            <input id="cc" className={field} autoComplete="address-level2" value={form.city} onChange={set('city')} />
            <label className="block text-sm font-semibold" htmlFor="ca">Full address</label>
            <textarea id="ca" rows={3} className="w-full rounded-lg border border-slate-300 p-3 text-base" autoComplete="street-address" value={form.line} onChange={set('line')} />
            <label className="block text-sm font-semibold" htmlFor="cm">Note (optional)</label>
            <input id="cm" className={field} value={form.note} onChange={set('note')} />

            <div className="rounded-xl bg-green-50 p-4 text-sm">
              <div className="mb-1 font-semibold">Payment: Cash on Delivery</div>
              <div className="mb-2 text-slate-700">Estimated delivery: {estimate}</div>
              <div className="flex justify-between"><span>Subtotal</span><span>{money(t.subtotal)}</span></div>
              {t.taxRate > 0 && <div className="flex justify-between"><span>Tax</span><span>{money(t.tax)}</span></div>}
              <div className="flex justify-between"><span>Delivery</span><span>{t.shipping === 0 ? 'Free' : money(t.shipping)}</span></div>
              <div className="mt-1 flex justify-between text-lg font-bold"><span>Total</span><span>{money(t.total)}</span></div>
            </div>
            {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
            <button disabled={busy || items.length === 0} className="min-h-[52px] w-full rounded-xl bg-ink font-bold text-white disabled:opacity-50">{busy ? 'Placing order...' : 'Place order'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
