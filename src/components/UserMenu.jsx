import { useState } from 'react'
import { Link } from 'react-router-dom'
import { User } from 'lucide-react'
import { showPhone } from '../data/format'

export default function UserMenu({ user, onLogin, onLogout }) {
  const [open, setOpen] = useState(false)
  const item = 'block w-full min-h-[44px] px-4 py-3 text-left text-sm hover:bg-slate-100'

  return (
    <div className="relative">
      <button
        aria-label={user ? 'Account menu' : 'Log in'}
        onClick={() => (user ? setOpen(!open) : onLogin())}
        className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-600 bg-panel px-3 hover:border-volt"
      >
        <User className="h-5 w-5" />
        <span className="hidden text-sm font-semibold sm:inline">{user ? user.name.split(' ')[0] : 'Log in'}</span>
      </button>
      {open && user && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl bg-white py-1 text-ink shadow-xl">
            <div className="border-b border-slate-200 px-4 py-3 text-sm">
              <div className="font-semibold">{user.name}</div>
              <div className="truncate text-slate-600">{user.email || showPhone(user.phone)}</div>
            </div>
            <Link to="/orders" className={item} onClick={() => setOpen(false)}>My orders</Link>
            {user.role === 'admin' && <Link to="/admin" className={item} onClick={() => setOpen(false)}>Admin panel</Link>}
            <button className={item + ' text-red-700'} onClick={() => { setOpen(false); onLogout() }}>Log out</button>
          </div>
        </>
      )}
    </div>
  )
}
