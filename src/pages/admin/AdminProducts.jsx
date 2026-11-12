import { useEffect, useState } from 'react'
import { api } from '../../api'
import { CATEGORIES, money } from '../../data/products'

const EMPTY = { name: '', category: CATEGORIES[0], price: '', oldPrice: '', stock: '', image: '', description: '', active: true }

export default function AdminProducts() {
  const [products, setProducts] = useState(null)
  const [form, setForm] = useState(null) // null = closed, object = editing/adding
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => api.get('/admin/products').then((d) => setProducts(d.products)).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const openNew = () => { setEditId(null); setForm(EMPTY); setError('') }
  const openEdit = (p) => { setEditId(p.id); setForm({ ...EMPTY, ...p }); setError('') }

  const save = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      if (editId) await api.put('/admin/products/' + editId, form)
      else await api.post('/admin/products', form)
      setForm(null)
      await load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? Old orders will keep their copy.`)) return
    try { await api.del('/admin/products/' + p.id); await load() } catch (err) { setError(err.message) }
  }
  const field = 'h-11 w-full rounded-lg border border-slate-300 px-3'

  if (!products && !error) return <p>Loading...</p>
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Products</h1>
        <button onClick={openNew} className="min-h-[44px] rounded-xl bg-ink px-5 font-bold text-white">Add product</button>
      </div>
      {error && !form && <p role="alert" className="font-semibold text-red-700">{error}</p>}

      {form && (
        <form onSubmit={save} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-display text-xl font-bold">{editId ? 'Edit product' : 'New product'}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="text-sm font-semibold" htmlFor="pn">Name</label><input id="pn" className={field} value={form.name} onChange={set('name')} /></div>
            <div><label className="text-sm font-semibold" htmlFor="pc">Category</label>
              <select id="pc" className={field} value={form.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label className="text-sm font-semibold" htmlFor="ps">Stock (units)</label><input id="ps" type="number" min="0" className={field} value={form.stock} onChange={set('stock')} /></div>
            <div><label className="text-sm font-semibold" htmlFor="pp">Price (Rs)</label><input id="pp" type="number" min="1" className={field} value={form.price} onChange={set('price')} /></div>
            <div><label className="text-sm font-semibold" htmlFor="po">Old price (Rs, optional)</label><input id="po" type="number" min="1" className={field} value={form.oldPrice} onChange={set('oldPrice')} /></div>
            <div className="sm:col-span-2"><label className="text-sm font-semibold" htmlFor="pi">Image path or link</label><input id="pi" className={field} placeholder="/images/layer-feed.jpg" value={form.image} onChange={set('image')} /></div>
            <div className="sm:col-span-2"><label className="text-sm font-semibold" htmlFor="pd">Description</label><textarea id="pd" rows={3} maxLength={500} className="w-full rounded-lg border border-slate-300 p-3" value={form.description} onChange={set('description')} /></div>
          </div>
          <label className="flex min-h-[44px] items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-5 w-5" checked={form.active} onChange={set('active')} /> Show in shop</label>
          {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
          <div className="flex gap-2">
            <button disabled={busy} className="min-h-[44px] rounded-xl bg-ink px-6 font-bold text-white disabled:opacity-50">{busy ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => setForm(null)} className="min-h-[44px] rounded-xl border border-slate-300 px-6 font-semibold">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr><th className="p-3">Product</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {products?.map((p) => (
              <tr key={p.id}>
                <td className="p-3"><div className="font-semibold">{p.name}</div><div className="text-slate-600">{p.category}</div></td>
                <td className="p-3">{money(p.price)}</td>
                <td className={`p-3 font-semibold ${p.stock <= 5 ? 'text-red-700' : ''}`}>{p.stock}</td>
                <td className="p-3">{p.active ? 'Visible' : 'Hidden'}</td>
                <td className="p-3 text-right"><button onClick={() => openEdit(p)} className="min-h-[44px] px-3 font-semibold text-green-800">Edit</button><button onClick={() => remove(p)} className="min-h-[44px] px-3 font-semibold text-red-700">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
