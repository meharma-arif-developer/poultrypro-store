import { Feather, Search, ShoppingCart } from 'lucide-react'
import UserMenu from './UserMenu'
import { CATEGORIES } from '../data/products'
import { STORE } from '../data/store'

export default function Navbar({ query, setQuery, category, setCategory, cartCount, onCartClick, user, onLogin, onLogout }) {
  return (
    <header className="sticky top-0 z-40 bg-ink text-slate-200">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <a href="#top" className="flex items-center gap-2 font-display text-2xl font-bold text-white">
          <Feather className="h-6 w-6 text-volt" aria-hidden="true" /> {STORE.name}
        </a>

        <select
          aria-label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-11 rounded-lg border border-slate-600 bg-panel px-3 text-sm"
        >
          <option value="All">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <div className="order-last flex h-11 w-full min-w-0 items-center gap-2 rounded-lg border border-slate-600 bg-panel px-3 sm:order-none sm:w-auto sm:flex-1">
          <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            aria-label="Search products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search feed, incubators, drinkers..."
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white placeholder-slate-400 outline-none"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <button aria-label="Open cart" onClick={onCartClick}
            className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-slate-600 bg-panel hover:border-volt">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-volt px-1 text-xs font-bold text-ink">
              {cartCount}
            </span>
          </button>
          <UserMenu user={user} onLogin={onLogin} onLogout={onLogout} />
        </div>
      </div>
    </header>
  )
}
