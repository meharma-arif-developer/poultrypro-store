import { useEffect, useState } from 'react'
import { api } from '../api'
import Stars from './Stars'
import ReviewCard from './ReviewCard'
import ReviewForm from './ReviewForm'

export default function ReviewsSection({ onLogin }) {
  const [data, setData] = useState(null)
  const [writing, setWriting] = useState(false)
  const load = () => api.get('/reviews/featured').then(setData).catch(() => setData({ reviews: [], summary: { average: 0, count: 0, breakdown: {} } }))
  useEffect(() => { load() }, [])
  if (!data) return null
  const { reviews, summary } = data

  return (
    <section id="reviews" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-16 sm:px-6">
      <h2 className="mb-6 font-display text-3xl font-bold">What our customers say</h2>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-1">
          {summary.count > 0 ? (
            <>
              <div className="flex items-end gap-3"><span className="font-display text-5xl font-bold">{summary.average}</span><span className="pb-1 text-slate-600">out of 5</span></div>
              <div className="mt-1"><Stars value={summary.average} className="h-5 w-5" /></div>
              <p className="mt-1 text-sm text-slate-600">Based on {summary.count} review{summary.count === 1 ? '' : 's'}</p>
              <div className="mt-4 space-y-1.5">
                {[5, 4, 3, 2, 1].map((n) => (
                  <div key={n} className="flex items-center gap-2 text-sm">
                    <span className="w-8">{n} ★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-amber-400" style={{ width: `${((summary.breakdown[n] || 0) / summary.count) * 100}%` }} /></div>
                    <span className="w-6 text-right text-slate-600">{summary.breakdown[n] || 0}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-slate-600">No reviews yet. Be the first to share your experience!</p>}
          <button onClick={() => setWriting(!writing)} className="mt-5 min-h-[44px] w-full rounded-xl border border-ink font-semibold hover:bg-ink hover:text-white">{writing ? 'Close' : 'Write a review'}</button>
          {writing && <div className="mt-4"><ReviewForm onLogin={onLogin} onDone={() => { setWriting(false); load() }} /></div>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {reviews.map((r) => <ReviewCard key={r.id} r={r} showProduct />)}
        </div>
      </div>
    </section>
  )
}
