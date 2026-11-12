import { useEffect, useState } from 'react'
import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom'
import { Feather, LayoutDashboard, ShoppingBag, Package, Users, Star, Inbox, Menu, X, LogOut, Store } from 'lucide-react'
import { api } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { STORE } from '../../data/store'
import AdminDashboard from './AdminDashboard'
import AdminOrders from './AdminOrders'
import AdminProducts from './AdminProducts'
import AdminCustomers from './AdminCustomers'
import AdminReviews from './AdminReviews'
import AdminMessages from './AdminMessages'

function AdminLogin({ onLogin }) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const field = 'h-12 w-full rounded-lg border border-slate-300 px-3 text-base'

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const d = await api.post('/auth/admin-login', { login, password })
      onLogin(d.token, d.user)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-2 font-display text-2xl font-bold"><Feather className="h-6 w-6 text-green-700" />{STORE.name} Seller</div>
        <p className="text-sm text-slate-600">Admin login</p>
        <label className="block text-sm font-semibold" htmlFor="al">Phone number or email</label>
        <input id="al" className={field} value={login} onChange={(e) => setLogin(e.target.value)} autoFocus />
        <label className="block text-sm font-semibold" htmlFor="aw">Password</label>
        <input id="aw" type="password" className={field} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
        <button disabled={busy} className="min-h-[48px] w-full rounded-xl bg-ink font-bold text-white disabled:opacity-50">{busy ? 'Checking...' : 'Log in'}</button>
        <Link to="/" className="block pt-1 text-center text-sm font-semibold text-green-800">Back to shop</Link>
      </form>
    </div>
  )
}

export default function AdminApp() {
  const { user, loading, login, logout } = useAuth()
  const [menu, setMenu] = useState(false)
  const [badges, setBadges] = useState({ pending: 0, unreadMessages: 0 })
  const loc = useLocation()
  const isAdmin = user?.role === 'admin'

  useEffect(() => { setMenu(false) }, [loc.pathname])
  useEffect(() => {
    if (!isAdmin) return
    const load = () => api.get('/admin/badges').then(setBadges).catch(() => {})
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [isAdmin, loc.pathname])

  if (loading) return <p className="p-8">Loading...</p>
  if (!isAdmin) return <AdminLogin onLogin={login} />

  const NAV = [
    ['/admin', 'Dashboard', LayoutDashboard, 0, true],
    ['/admin/orders', 'Orders', ShoppingBag, badges.pending],
    ['/admin/products', 'Products', Package, 0],
    ['/admin/customers', 'Customers', Users, 0],
    ['/admin/reviews', 'Reviews', Star, 0],
    ['/admin/messages', 'Messages', Inbox, badges.unreadMessages],
  ]
  const item = ({ isActive }) =>
    `flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-semibold ${isActive ? 'bg-volt text-ink' : 'text-slate-200 hover:bg-panel'}`

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      {menu && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMenu(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-display text-xl font-bold"><Feather className="h-5 w-5 text-volt" />{STORE.name}</div>
          <button aria-label="Close menu" onClick={() => setMenu(false)} className="flex h-11 w-11 items-center justify-center lg:hidden"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Admin">
          {NAV.map(([to, label, Icon, count, end]) => (
            <NavLink key={to} to={to} end={end} className={item}>
              <Icon className="h-5 w-5" /><span className="flex-1">{label}</span>
              {count > 0 && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">{count}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-panel p-3">
          <Link to="/" className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm text-slate-200 hover:bg-panel"><Store className="h-5 w-5" />View shop</Link>
          <button onClick={logout} className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-200 hover:bg-panel"><LogOut className="h-5 w-5" />Log out</button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button aria-label="Open menu" onClick={() => setMenu(true)} className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 lg:hidden"><Menu className="h-5 w-5" /></button>
          <div className="ml-auto flex items-center gap-2 text-sm">
            {badges.pending > 0 && <Link to="/admin/orders" className="rounded-full bg-amber-100 px-3 py-2 font-semibold text-amber-900">{badges.pending} pending order{badges.pending > 1 ? 's' : ''}</Link>}
            {badges.unreadMessages > 0 && <Link to="/admin/messages" className="rounded-full bg-rose-100 px-3 py-2 font-semibold text-rose-900">{badges.unreadMessages} new message{badges.unreadMessages > 1 ? 's' : ''}</Link>}
            <span className="hidden font-semibold sm:inline">{user.name}</span>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="*" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
