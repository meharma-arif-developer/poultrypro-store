import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api'
import { money } from '../../data/products'
import { showPhone } from '../../data/format'

export default function AdminCustomers() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  useEffect(() => { api.get('/admin/customers').then((d) => setRows(d.customers)).catch((e) => setError(e.message)) }, [])
  const shown = useMemo(() => (rows || []).filter((c) => `${c.name} ${c.email || ''} ${c.phone || ''}`.toLowerCase().includes(q.trim().toLowerCase())), [rows, q])
  if (error) return <p className="text-red-700">{error}</p>
  if (!rows) return <p>Loading...</p>
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-3xl font-bold">Customers ({rows.length})</h1>
        <input aria-label="Search customers" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone" className="h-11 w-full rounded-lg border border-slate-300 px-3 sm:w-72" /></div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr><th className="p-3">Customer</th><th className="p-3">Contact</th><th className="p-3">Signed up with</th><th className="p-3">Orders</th><th className="p-3">Spent</th><th className="p-3">Joined</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((c) => (
              <tr key={c.id}><td className="p-3 font-semibold">{c.name}</td><td className="p-3">{c.email || showPhone(c.phone)}</td><td className="p-3">{c.via}</td><td className="p-3">{c.orders}</td><td className="p-3">{money(c.spent)}</td><td className="p-3">{new Date(c.joined).toLocaleDateString('en-GB')}</td></tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="p-8 text-center text-slate-600">No customers found.</p>}
      </div>
    </div>
  )
}
