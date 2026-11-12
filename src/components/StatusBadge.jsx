export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']

const COLORS = {
  Pending: 'bg-amber-100 text-amber-900',
  Confirmed: 'bg-blue-100 text-blue-900',
  Shipped: 'bg-indigo-100 text-indigo-900',
  Delivered: 'bg-green-100 text-green-900',
  Cancelled: 'bg-red-100 text-red-900',
}

export default function StatusBadge({ status }) {
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${COLORS[status] || 'bg-slate-100'}`}>{status}</span>
}

export const fmtDate = (iso) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
