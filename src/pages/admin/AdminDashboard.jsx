import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, TrendingUp, ShoppingBag, Users, Star, TrendingDown } from 'lucide-react'
import { api } from '../../api'
import { money } from '../../data/products'
import StatusBadge, { ORDER_STATUSES, fmtDate } from '../../components/StatusBadge'

const BAR = { Pending: 'bg-amber-400', Confirmed: 'bg-blue-500', Shipped: 'bg-indigo-500', Delivered: 'bg-green-500', Cancelled: 'bg-red-400' }

function SalesChart({ series }) {
  const W = 640, H = 220, pad = { l: 8, r: 8, t: 12, b: 28 }
  const max = Math.max(...series.map((s) => s.sales), 1)
  const bw = (W - pad.l - pad.r) / series.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Sales for the last 14 days">
      {[0.25, 0.5, 0.75, 1].map((g) => <line key={g} x1={pad.l} x2={W - pad.r} y1={pad.t + (H - pad.t - pad.b) * (1 - g)} y2={pad.t + (H - pad.t - pad.b) * (1 - g)} stroke="#e2e8f0" />)}
      {series.map((s, i) => {
        const h = ((H - pad.t - pad.b) * s.sales) / max
        return (
          <g key={s.key}>
            <rect x={pad.l + i * bw + 5} y={H - pad.b - h} width={bw - 10} height={Math.max(h, s.sales ? 2 : 0)} rx="4" fill="#15803d"><title>{`${s.label}: ${money(s.sales)} (${s.orders} orders)`}</title></rect>
            {i % 2 === 0 && <text x={pad.l + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#64748b">{s.label}</text>}
          </g>
        )
      })}
    </svg>
  )
}

export default function AdminDashboard() {
  const [s, setS] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { api.get('/admin/stats').then(setS).catch((e) => setError(e.message)) }, [])
  if (error) return <p className="text-red-700">{error}</p>
  if (!s) return <p>Loading...</p>

  const change = s.yesterdaySales ? Math.round(((s.todaySales - s.yesterdaySales) / s.yesterdaySales) * 100) : null
  const total14 = s.series.reduce((a, x) => a + x.sales, 0)
  const cards = [
    { label: "Today's sales", value: money(s.todaySales), icon: Wallet, sub: change === null ? `${s.todayOrders} orders today` : `${change >= 0 ? '+' : ''}${change}% vs yesterday`, up: change === null ? null : change >= 0, tone: 'bg-green-100 text-green-800' },
    { label: 'Total sales', value: money(s.sales), icon: TrendingUp, sub: 'Excludes cancelled orders', tone: 'bg-blue-100 text-blue-800' },
    { label: 'Orders', value: s.totalOrders, icon: ShoppingBag, sub: `${s.pending} pending`, tone: 'bg-amber-100 text-amber-800' },
    { label: 'Customers', value: s.customers, icon: Users, sub: 'Registered accounts', tone: 'bg-indigo-100 text-indigo-800' },
    { label: 'Store rating', value: s.reviews.count ? `${s.reviews.average} / 5` : 'No reviews', icon: Star, sub: `${s.reviews.count} review${s.reviews.count === 1 ? '' : 's'}`, tone: 'bg-rose-100 text-rose-800' },
  ]
  const totalOrders = Math.max(s.totalOrders, 1)

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl font-bold">Dashboard</h1><p className="text-slate-600">Here is how your shop is doing.</p></div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${c.tone}`}><c.icon className="h-5 w-5" /></div>
            <div className="text-sm text-slate-600">{c.label}</div>
            <div className="font-display text-xl font-bold sm:text-2xl">{c.value}</div>
            <div className={`mt-1 flex items-center gap-1 text-xs ${c.up === true ? 'text-green-700' : c.up === false ? 'text-red-700' : 'text-slate-500'}`}>
              {c.up === true && <TrendingUp className="h-3 w-3" />}{c.up === false && <TrendingDown className="h-3 w-3" />}{c.sub}
            </div>
          </div>
        ))}
      </div>

      {s.unreadMessages > 0 && (
        <Link to="/admin/messages" className="block rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-900 ring-1 ring-rose-200">
          You have {s.unreadMessages} unread message{s.unreadMessages > 1 ? 's' : ''}. Tap to read and reply.
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <div className="mb-2 flex items-baseline justify-between"><h2 className="font-display text-lg font-bold">Sales, last 14 days</h2><span className="text-sm text-slate-600">{money(total14)}</span></div>
          <SalesChart series={s.series} />
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-display text-lg font-bold">Orders by status</h2>
          <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
            {ORDER_STATUSES.map((st) => <div key={st} className={BAR[st]} style={{ width: `${(s.statusCounts[st] / totalOrders) * 100}%` }} title={st} />)}
          </div>
          <ul className="space-y-2 text-sm">
            {ORDER_STATUSES.map((st) => <li key={st} className="flex items-center justify-between"><span className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${BAR[st]}`} />{st}</span><b>{s.statusCounts[st]}</b></li>)}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg font-bold">Recent orders</h2><Link to="/admin/orders" className="min-h-[44px] content-center text-sm font-semibold text-green-800">See all</Link></div>
          {s.recent.length === 0 && <p className="text-sm text-slate-600">No orders yet. They will show up here.</p>}
          <ul className="divide-y divide-slate-100">
            {s.recent.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div><div className="font-semibold">{o.number} · {o.address.name}</div><div className="text-slate-600">{fmtDate(o.createdAt)} · {o.address.city}</div></div>
                <div className="flex items-center gap-3"><span className="font-semibold">{money(o.total)}</span><StatusBadge status={o.status} /></div>
              </li>
            ))}
          </ul>
        </section>
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-display text-lg font-bold">Top products</h2>
            {s.topProducts.length === 0 && <p className="text-sm text-slate-600">No sales yet.</p>}
            <ul className="space-y-3 text-sm">
              {s.topProducts.map((p) => (
                <li key={p.name}><div className="flex justify-between gap-2"><span className="truncate">{p.name}</span><b>{p.qty} sold</b></div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-green-600" style={{ width: `${(p.qty / s.topProducts[0].qty) * 100}%` }} /></div></li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-display text-lg font-bold">Low stock</h2>
            {s.lowStock.length === 0 && <p className="text-sm text-slate-600">All products are well stocked.</p>}
            <ul className="space-y-2 text-sm">{s.lowStock.map((p) => <li key={p.id} className="flex justify-between gap-2"><span>{p.name}</span><b className={p.stock === 0 ? 'text-red-700' : 'text-amber-700'}>{p.stock}</b></li>)}</ul>
          </section>
        </div>
      </div>
    </div>
  )
}
