import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { api } from '../api'
import { money } from '../data/products'
import Stars from './Stars'
import ProductImage from './ProductImage'
import ReviewCard from './ReviewCard'
import ReviewForm from './ReviewForm'

export default function ProductModal({ product, onClose, onAdd, onLogin }) {
  const [data, setData] = useState(null)
  const load = () => api.get('/reviews?productId=' + product.id).then(setData).catch(() => setData({ reviews: [], summary: { average: 0, count: 0 } }))
  useEffect(() => { load() }, [product.id])
  const off = Math.round((1 - product.price / product.oldPrice) * 100)

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/60" onClick={onClose} />
      <div role="dialog" aria-label={product.name} className="relative max-h-full w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <button aria-label="Close" onClick={onClose} className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow"><X className="h-5 w-5" /></button>
        <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
          <div className="h-64 overflow-hidden rounded-xl bg-slate-200 sm:h-72"><ProductImage key={product.image} src={product.image} alt={product.name} /></div>
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold text-green-700">{product.category}</div>
            <h2 className="font-display text-2xl font-bold leading-snug">{product.name}</h2>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              {data?.summary.count > 0 ? (<><Stars value={data.summary.average} /><span>{data.summary.average} ({data.summary.count} review{data.summary.count === 1 ? '' : 's'})</span></>) : <span>No reviews yet</span>}
            </div>
            <p className="text-[15px] leading-relaxed text-slate-700">{product.description}</p>
            <div className="mt-auto flex items-baseline gap-2 pt-2">
              <span className="text-3xl font-bold">{money(product.price)}</span>
              {off > 0 && <span className="text-slate-500 line-through">{money(product.oldPrice)}</span>}
            </div>
            <div className="text-sm text-slate-600">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</div>
            <button onClick={() => { onAdd(product.id); onClose() }} disabled={product.stock <= 0}
              className="min-h-[48px] rounded-xl bg-ink font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600">{product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}</button>
          </div>
        </div>
        <div className="space-y-4 border-t border-slate-200 bg-slate-50 p-5 sm:p-6">
          <h3 className="font-display text-xl font-bold">Customer reviews</h3>
          {data?.reviews.length === 0 && <p className="text-sm text-slate-600">Be the first to review this product.</p>}
          <div className="grid gap-3 sm:grid-cols-2">{data?.reviews.map((r) => <ReviewCard key={r.id} r={r} />)}</div>
          <ReviewForm productId={product.id} onLogin={onLogin} onDone={load} />
        </div>
      </div>
    </div>
  )
}
