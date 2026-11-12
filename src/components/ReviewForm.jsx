import { useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { StarInput } from './Stars'

export default function ReviewForm({ productId = null, onDone, onLogin }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user) {
    return (
      <div className="rounded-xl bg-slate-50 p-4 text-sm">
        <p className="mb-2 text-slate-700">Log in to share your experience.</p>
        <button onClick={onLogin} className="min-h-[44px] rounded-lg bg-ink px-5 font-semibold text-white">Log in to write a review</button>
      </div>
    )
  }
  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const d = await api.post('/reviews', { productId, rating, text })
      setRating(0); setText('')
      onDone?.(d.review)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl bg-slate-50 p-4">
      <div className="text-sm font-semibold">Your rating</div>
      <StarInput value={rating} onChange={setRating} />
      <label htmlFor={`rv-${productId}`} className="block text-sm font-semibold">Your review</label>
      <textarea id={`rv-${productId}`} rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)}
        placeholder="What did you like? How is the quality?" className="w-full rounded-lg border border-slate-300 p-3 text-base" />
      {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
      <button disabled={busy || !rating} className="min-h-[44px] rounded-lg bg-ink px-5 font-semibold text-white disabled:opacity-50">{busy ? 'Posting...' : 'Post review'}</button>
    </form>
  )
}
