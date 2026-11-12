import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { money } from '../data/products'
import StatusBadge, { fmtDate } from '../components/StatusBadge'
import { fmtDay } from '../data/format'
import LoginModal from '../components/LoginModal'

export default function MyOrders() {
  const { user, loading } = useAuth()
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [loginOpen, setLoginOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    api.get('/orders/mine').then((d) => setOrders(d.orders)).catch((e) => setError(e.message))
  }, [user])

  return (
    <div className="min-h-screen">
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Link to="/" className="flex min-h-[44px] items-center gap-2 font-semibold"><ArrowLeft className="h-5 w-5" /> Back to shop</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 font-display text-3xl font-bold">My orders</h1>
        {loading && <p>Loading...</p>}
        {!loading && !user && (
          <div className="rounded-2xl bg-white p-8 text-center">
            <p className="mb-4 text-slate-600">Log in to see your orders.</p>
            <button onClick={() => setLoginOpen(true)} className="min-h-[48px] rounded-xl bg-ink px-6 font-bold text-white">Log in</button>
          </div>
        )}
        {error && <p className="text-red-700">{error}</p>}
        {user && orders && orders.length === 0 && <div className="rounded-2xl bg-white p-8 text-center text-slate-600">You have not placed any orders yet.</div>}
        <div className="space-y-4">
          {orders?.map((o) => (
            <article key={o.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><div className="font-display text-lg font-bold">{o.number}</div><div className="text-sm text-slate-600">{fmtDate(o.createdAt)}</div></div>
                <StatusBadge status={o.status} />
              </div>
              <ul className="my-3 divide-y divide-slate-100 text-sm">
                {o.items.map((i) => <li key={i.productId} className="flex justify-between gap-3 py-2"><span>{i.name} × {i.qty}</span><span>{money(i.price * i.qty)}</span></li>)}
              </ul>
              <div className="flex justify-between text-sm text-slate-600"><span>Delivery</span><span>{o.shipping === 0 ? 'Free' : money(o.shipping)}</span></div>
              <div className="mt-1 flex justify-between text-lg font-bold"><span>Total (Cash on Delivery)</span><span>{money(o.total)}</span></div>
              <p className="mt-3 text-sm text-slate-600">Deliver to: {o.address.name}, {o.address.line}, {o.address.city}</p>
              {o.eta && !['Delivered', 'Cancelled'].includes(o.status) && <p className="mt-1 text-sm font-semibold text-green-800">Estimated delivery: {fmtDay(o.eta.from)} to {fmtDay(o.eta.to)}</p>}
            </article>
          ))}
        </div>
      </main>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  )
}
