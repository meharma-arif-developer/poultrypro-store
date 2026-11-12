import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api'
import { money } from '../../data/products'
import { showPhone } from '../../data/format'
import StatusBadge, { ORDER_STATUSES, fmtDate } from '../../components/StatusBadge'

export default function AdminOrders() {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)

  useEffect(() => { api.get('/admin/orders').then((d) => setOrders(d.orders)).catch((e) => setError(e.message)) }, [])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (orders || []).filter((o) =>
      (filter === 'All' || o.status === filter) &&
      (!needle || `${o.number} ${o.address.name} ${o.address.phone} ${o.customer.phone}`.toLowerCase().includes(needle)))
  }, [orders, filter, q])

  const changeStatus = async (o, status) => {
    if (status === o.status) return
    if (status === 'Cancelled' && !window.confirm(`Cancel order ${o.number}? Stock will be returned.`)) return
    setError('')
    try {
      const d = await api.patch('/admin/orders/' + o.id, { status })
      setOrders((prev) => prev.map((x) => (x.id === o.id ? d.order : x)))
    } catch (e) { setError(e.message) }
  }

  const exportCsv = () => {
    const safe = (v) => { const t = String(v); return `"${(/^[=+\-@]/.test(t) ? "'" + t : t).replace(/"/g, '""')}"` }
    const rows = [['Order', 'Date', 'Name', 'Phone', 'Email', 'City', 'Address', 'Items', 'Total', 'Status']]
    shown.forEach((o) => rows.push([o.number, o.createdAt, o.address.name, showPhone(o.address.phone), o.email || '', o.address.city, o.address.line, o.items.map((i) => `${i.name} x${i.qty}`).join('; '), o.total, o.status]))
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.map(safe).join(',')).join('\n')], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click(); URL.revokeObjectURL(url)
  }

  if (!orders && !error) return <p>Loading...</p>
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-bold">Orders</h1>
      <div className="flex flex-wrap gap-3">
        <select aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value)} className="h-11 rounded-lg border border-slate-300 bg-white px-3">
          <option>All</option>{ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input aria-label="Search orders" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order no., name or phone" className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3" />
        <button onClick={exportCsv} className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold">Export CSV</button>
      </div>
      {error && <p role="alert" className="font-semibold text-red-700">{error}</p>}
      {orders && shown.length === 0 && <div className="rounded-2xl bg-white p-8 text-center text-slate-600">No orders found.</div>}
      <div className="space-y-3">
        {shown.map((o) => {
          const closed = ['Delivered', 'Cancelled'].includes(o.status)
          return (
            <article key={o.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button onClick={() => setOpen(open === o.id ? null : o.id)} className="min-h-[44px] text-left">
                  <div className="font-display text-lg font-bold">{o.number}</div>
                  <div className="text-sm text-slate-600">{fmtDate(o.createdAt)} · {o.address.name} · {o.address.city}</div>
                </button>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-bold">{money(o.total)}</span>
                  <StatusBadge status={o.status} />
                  <select aria-label={`Change status of ${o.number}`} value={o.status} disabled={closed} onChange={(e) => changeStatus(o, e.target.value)}
                    className="h-11 rounded-lg border border-slate-300 bg-white px-2 text-sm disabled:bg-slate-100">
                    {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {open === o.id && (
                <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 text-sm md:grid-cols-2">
                  <div>
                    <div className="mb-1 font-semibold">Deliver to</div>
                    <p>{o.address.name}<br />0{o.address.phone.slice(2)}<br />{o.address.line}, {o.address.city}</p>
                    {o.address.note && <p className="mt-2 text-slate-600">Note: {o.address.note}</p>}
                    <p className="mt-2 text-slate-600">Account: {o.customer.name} ({o.customer.email || showPhone(o.customer.phone)})<br />Email for updates: {o.email || 'not given'}<br />Payment: {o.payment}</p>
                  </div>
                  <div>
                    <div className="mb-1 font-semibold">Items</div>
                    <ul className="space-y-1">{o.items.map((i) => <li key={i.productId} className="flex justify-between gap-3"><span>{i.name} × {i.qty}</span><span>{money(i.price * i.qty)}</span></li>)}</ul>
                    <div className="mt-2 flex justify-between text-slate-600"><span>Delivery</span><span>{o.shipping === 0 ? 'Free' : money(o.shipping)}</span></div>
                    <div className="mt-3 text-xs text-slate-600">{o.history.map((h) => `${h.status} (${fmtDate(h.at)})`).join('  →  ')}</div>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
