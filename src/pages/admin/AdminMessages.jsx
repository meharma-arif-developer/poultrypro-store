import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { api } from '../../api'
import { fmtDate } from '../../components/StatusBadge'

export default function AdminMessages() {
  const [list, setList] = useState(null)
  const [sel, setSel] = useState(null)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => api.get('/admin/messages').then((d) => setList(d.messages)).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])
  const current = list?.find((m) => m.id === sel)

  const open = async (m) => {
    setSel(m.id); setText(''); setError(''); setNote('')
    if (m.status === 'new') { try { await api.patch('/admin/messages/' + m.id); await load() } catch { /* ignore */ } }
  }
  const send = async (e) => {
    e.preventDefault()
    setError(''); setNote(''); setBusy(true)
    try {
      const d = await api.post(`/admin/messages/${current.id}/reply`, { text })
      setText('')
      setNote(d.emailed ? 'Reply emailed to the customer.' : 'Reply saved, but no email was sent because SMTP is not set up in .env yet.')
      await load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const remove = async () => {
    if (!window.confirm('Delete this conversation?')) return
    try { await api.del('/admin/messages/' + current.id); setSel(null); await load() } catch (err) { setError(err.message) }
  }

  if (!list && !error) return <p>Loading...</p>
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-bold">Messages</h1>
      {error && !current && <p role="alert" className="font-semibold text-red-700">{error}</p>}
      {list?.length === 0 && <div className="rounded-2xl bg-white p-8 text-center text-slate-600">No messages yet. Messages from the &ldquo;Let&rsquo;s collaborate&rdquo; form will appear here.</div>}
      {list?.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-5">
          <ul className={`divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:col-span-2 ${current ? 'hidden lg:block' : ''}`}>
            {list.map((m) => (
              <li key={m.id}>
                <button onClick={() => open(m)} className={`block min-h-[64px] w-full p-4 text-left hover:bg-slate-50 ${sel === m.id ? 'bg-green-50' : ''}`}>
                  <div className="flex items-center justify-between gap-2"><span className={`truncate ${m.status === 'new' ? 'font-bold' : 'font-semibold'}`}>{m.name}</span>
                    {m.status === 'new' ? <span className="h-2.5 w-2.5 flex-none rounded-full bg-rose-500" aria-label="Unread" /> : m.status === 'replied' ? <span className="text-xs text-green-700">Replied</span> : null}</div>
                  <div className="truncate text-sm text-slate-600">{m.text}</div>
                  <div className="text-xs text-slate-500">{fmtDate(m.createdAt)}</div>
                </button>
              </li>
            ))}
          </ul>
          {current ? (
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-3">
              <button onClick={() => setSel(null)} className="flex min-h-[44px] items-center gap-2 text-sm font-semibold text-green-800 lg:hidden"><ArrowLeft className="h-4 w-4" />All messages</button>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><div className="font-display text-xl font-bold">{current.name}</div><a href={`mailto:${current.email}`} className="text-sm text-green-800">{current.email}</a></div>
                <button onClick={remove} className="min-h-[44px] px-3 text-sm font-semibold text-red-700">Delete</button>
              </div>
              <div className="rounded-xl bg-slate-100 p-4 text-sm"><div className="mb-1 text-xs text-slate-500">{fmtDate(current.createdAt)}</div><p className="whitespace-pre-wrap">{current.text}</p></div>
              {current.replies.map((r, i) => (
                <div key={i} className="ml-6 rounded-xl bg-green-50 p-4 text-sm"><div className="mb-1 text-xs text-slate-500">You · {fmtDate(r.at)}{r.emailed ? ' · emailed' : ' · not emailed'}</div><p className="whitespace-pre-wrap">{r.text}</p></div>
              ))}
              <form onSubmit={send} className="space-y-2">
                <label htmlFor="rp" className="block text-sm font-semibold">Reply (sent to {current.email})</label>
                <textarea id="rp" rows={4} value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded-lg border border-slate-300 p-3 text-base" />
                {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
                {note && <p className="text-sm font-semibold text-green-800">{note}</p>}
                <button disabled={busy || text.trim().length < 2} className="min-h-[48px] rounded-xl bg-ink px-6 font-bold text-white disabled:opacity-50">{busy ? 'Sending...' : 'Send reply'}</button>
              </form>
            </section>
          ) : <div className="hidden rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500 lg:col-span-3 lg:block">Select a message to read and reply.</div>}
        </div>
      )}
    </div>
  )
}
