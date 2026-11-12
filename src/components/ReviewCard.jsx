import { BadgeCheck } from 'lucide-react'
import Stars from './Stars'

export default function ReviewCard({ r, showProduct = false }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-2"><Stars value={r.rating} /><span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
      <p className="mt-3 text-[15px] leading-relaxed">{r.text}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-semibold">{r.name}</span>
        {r.verified && <span className="inline-flex items-center gap-1 text-green-700"><BadgeCheck className="h-4 w-4" />Verified buyer</span>}
      </div>
      {showProduct && r.productName && <div className="mt-1 text-xs text-slate-500">on {r.productName}</div>}
      {r.reply && <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm"><b>Seller reply:</b> {r.reply}</div>}
    </article>
  )
}
