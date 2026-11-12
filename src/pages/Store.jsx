import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import CategoryTabs from '../components/CategoryTabs'
import ProductGrid from '../components/ProductGrid'
import CartDrawer from '../components/CartDrawer'
import Features from '../components/Features'
import Footer from '../components/Footer'
import LoginModal from '../components/LoginModal'
import CheckoutModal from '../components/CheckoutModal'
import ProductModal from '../components/ProductModal'
import ReviewsSection from '../components/ReviewsSection'
import ContactSection from '../components/ContactSection'
import WhatsAppButton from '../components/WhatsAppButton'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

const CART_KEY = 'pp_cart'
const readCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || [] } catch { return [] } }

export default function Store() {
  const { user, logout } = useAuth()
  const [products, setProducts] = useState([])
  const [status, setStatus] = useState('loading')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [cart, setCart] = useState(readCart)
  const [wishlist, setWishlist] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [afterLogin, setAfterLogin] = useState(false)
  const [viewing, setViewing] = useState(null)

  useEffect(() => {
    api.get('/products').then((d) => { setProducts(d.products); setStatus('ok') }).catch(() => setStatus('error'))
  }, [])
  useEffect(() => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)) } catch { /* ignore */ } }, [cart])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => (category === 'All' || p.category === category) && (!q || `${p.name} ${p.category}`.toLowerCase().includes(q)))
  }, [products, query, category])

  const cartItems = useMemo(
    () => cart.map((c) => { const p = products.find((x) => x.id === c.id); return p ? { ...p, qty: Math.min(c.qty, p.stock) } : null }).filter((i) => i && i.qty > 0),
    [cart, products]
  )
  const cartCount = cartItems.reduce((a, c) => a + c.qty, 0)

  const addToCart = (id) => {
    const p = products.find((x) => x.id === id)
    if (!p) return
    setCart((prev) => {
      const cur = prev.find((c) => c.id === id)
      if ((cur?.qty || 0) >= p.stock) return prev
      return cur ? prev.map((c) => (c.id === id ? { ...c, qty: c.qty + 1 } : c)) : [...prev, { id, qty: 1 }]
    })
    setCartOpen(true)
  }
  const setQty = (id, qty) => {
    const p = products.find((x) => x.id === id)
    setCart((prev) => (qty <= 0 ? prev.filter((c) => c.id !== id) : prev.map((c) => (c.id === id ? { ...c, qty: Math.min(qty, p?.stock ?? qty) } : c))))
  }
  const removeItem = (id) => setCart((prev) => prev.filter((c) => c.id !== id))
  const toggleWish = (id) => setWishlist((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]))

  const startCheckout = () => {
    setCartOpen(false)
    if (!user) { setAfterLogin(true); setLoginOpen(true) } else setCheckoutOpen(true)
  }
  const refreshProducts = () => api.get('/products').then((d) => setProducts(d.products)).catch(() => {})

  useEffect(() => {
    const anyOpen = cartOpen || loginOpen || checkoutOpen || !!viewing
    document.body.style.overflow = anyOpen ? 'hidden' : ''
    const onKey = (e) => { if (e.key === 'Escape') { setCartOpen(false); setLoginOpen(false); setViewing(null) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cartOpen, loginOpen, checkoutOpen, viewing])

  return (
    <>
      <Navbar query={query} setQuery={setQuery} category={category} setCategory={setCategory}
        cartCount={cartCount} onCartClick={() => setCartOpen(true)}
        user={user} onLogin={() => { setAfterLogin(false); setLoginOpen(true) }} onLogout={logout} />
      <Hero />
      <main id="shop" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-6 pt-14 sm:px-6">
        <h2 className="mb-5 font-display text-3xl font-bold">Shop our products</h2>
        <CategoryTabs category={category} setCategory={setCategory} />
        {status === 'loading' && <p className="py-10 text-center text-slate-600">Loading products...</p>}
        {status === 'error' && <p className="rounded-2xl bg-white p-8 text-center text-red-700">Could not load products. Make sure the server is running (npm run dev).</p>}
        {status === 'ok' && (
          <>
            <p className="mb-4 text-sm text-slate-600">{filtered.length} product{filtered.length === 1 ? '' : 's'}</p>
            <ProductGrid products={filtered} wishlist={wishlist} onWish={toggleWish} onAdd={addToCart} onOpen={setViewing} />
          </>
        )}
      </main>
      <Features />
      <ReviewsSection onLogin={() => { setAfterLogin(false); setLoginOpen(true) }} />
      <ContactSection />
      <Footer />
      <WhatsAppButton />
      {viewing && <ProductModal product={products.find((p) => p.id === viewing.id) || viewing} onClose={() => setViewing(null)} onAdd={addToCart} onLogin={() => { setAfterLogin(false); setLoginOpen(true) }} />}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} items={cartItems} onQty={setQty} onRemove={removeItem} onCheckout={startCheckout} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={() => { if (afterLogin) setCheckoutOpen(true) }} />
      <CheckoutModal key={user?.id || 'guest'} open={checkoutOpen} onClose={() => setCheckoutOpen(false)} items={cartItems}
        onPlaced={() => { setCart([]); refreshProducts() }} />
    </>
  )
}
