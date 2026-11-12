import { useEffect, useState } from 'react'
import { api } from '../../api'
import Stars from '../../components/Stars'

export default function AdminReviews() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [replies, setReplies] = useState({})
  const load = () => api.get('/admin/reviews').then(setData).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  const patch = async (r, body) => { setError(''); try { await api.patch('/admin/reviews/' + r.id, body); await load() } catch (e) { setError(e.message) } }
  const remove = async (r) => { if (!window.confirm('Delete this review permanently?')) return; try { await api.del('/admin/reviews/' + r.id); await load() } catch (e) { setError(e.message) } }

  if (!data && !error) return <p>Loading...</p>
  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-3xl font-bold">Reviews</h1>
        {data && <p className="text-slate-600">{data.summary.count} published · average {data.summary.average || '-'} / 5. Hide a review to remove it from the shop without deleting it.</p>}</div>
      {error && <p role="alert" className="font-semibold text-red-700">{error}</p>}
      {data?.reviews.length === 0 && <div className="rounded-2xl bg-white p-8 text-center text-slate-600">No reviews yet.</div>}
      <div className="space-y-3">
        {data?.reviews.map((r) => (
          <article key={r.id} className={`rounded-2xl border bg-white p-4 ${r.status === 'hidden' ? 'border-slate-200 opacity-70' : 'border-slate-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3"><Stars value={r.rating} /><span className="font-semibold">{r.name}</span>{r.verified && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">Verified buyer</span>}{r.status === 'hidden' && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold">Hidden</span>}</div>
              <span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString('en-GB')} · {r.productName || 'Whole store'}{r.email ? ` · ${r.email}` : ''}</span>
            </div>
            <p className="mt-2 text-sm">{r.text}</p>
            {r.reply && <p className="mt-2 rounded-lg bg-green-50 p-2 text-sm"><b>Your reply:</b> {r.reply}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input aria-label="Reply to review" value={replies[r.id] ?? ''} onChange={(e) => setReplies({ ...replies, [r.id]: e.target.value })} placeholder={r.reply ? 'Update your public reply' : 'Write a public reply'} maxLength={500} className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm" />
              <button onClick={() => { patch(r, { reply: replies[r.id] ?? '' }); setReplies({ ...replies, [r.id]: '' }) }} disabled={!(replies[r.id] || '').trim()} className="min-h-[44px] rounded-lg bg-ink px-4 text-sm font-semibold text-white disabled:opacity-40">Reply</button>
              <button onClick={() => patch(r, { status: r.status === 'hidden' ? 'published' : 'hidden' })} className="min-h-[44px] rounded-lg border border-slate-300 px-4 text-sm font-semibold">{r.status === 'hidden' ? 'Show' : 'Hide'}</button>
              <button onClick={() => remove(r)} className="min-h-[44px] px-3 text-sm font-semibold text-red-700">Delete</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
