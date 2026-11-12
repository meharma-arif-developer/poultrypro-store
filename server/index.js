import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { load, db, save, nextId } from './db.js'
import { OAuth2Client } from 'google-auth-library'
import { sendOtp } from './sms.js'
import * as mail from './mail.js'
import { SEED_PRODUCTS } from './seed.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const iso = () => new Date().toISOString()
const TZ = process.env.TIMEZONE || 'Asia/Karachi'
const dayKey = (v) => new Date(v).toLocaleDateString('en-CA', { timeZone: TZ })
const STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']

// ---------- setup ----------
load()
const d = db()
if (!d.meta.jwtSecret) d.meta.jwtSecret = crypto.randomBytes(48).toString('hex')
const SECRET = process.env.JWT_SECRET || d.meta.jwtSecret
const CFG = {
  taxRate: Number(process.env.TAX_RATE || 0),
  freeShippingOver: Number(process.env.FREE_SHIPPING_OVER || 15000),
  shippingFee: Number(process.env.SHIPPING_FEE || 500),
}
const DELIVERY = [Number(process.env.DELIVERY_DAYS_MIN || 2), Number(process.env.DELIVERY_DAYS_MAX || 4)]
const gClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10)
const normEmail = (e) => {
  const x = String(e || '').trim().toLowerCase()
  return x.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x) ? x : null
}
const devOtp = (process.env.OTP_MODE || 'console') === 'console' && process.env.NODE_ENV !== 'production'

function normPhone(p) {
  const x = String(p || '').replace(/\D/g, '')
  if (/^03\d{9}$/.test(x)) return '92' + x.slice(1)
  if (/^923\d{9}$/.test(x)) return x
  return null
}
const str = (v, min, max) => {
  const s = String(v ?? '').trim()
  return s.length >= min && s.length <= max ? s : null
}

if (d.products.length === 0) {
  for (const p of SEED_PRODUCTS) d.products.push({ ...p, id: nextId('product'), stock: 50, active: true, createdAt: iso() })
}
let admin = d.users.find((u) => u.role === 'admin')
const envPw = process.env.ADMIN_PASSWORD
if (!admin) {
  const pw = envPw || crypto.randomBytes(6).toString('base64url')
  admin = { id: nextId('user'), role: 'admin', name: 'Admin', phone: normPhone(process.env.ADMIN_PHONE || '03000000000'), email: normEmail(process.env.ADMIN_EMAIL), passwordHash: bcrypt.hashSync(pw, 10), createdAt: iso() }
  d.users.push(admin)
  console.log(`\n  ADMIN ACCOUNT CREATED\n  phone:    ${admin.phone ? '0' + admin.phone.slice(2) : ''}\n  password: ${envPw ? '(from your .env ADMIN_PASSWORD)' : pw}\n`)
} else if (envPw) {
  admin.passwordHash = bcrypt.hashSync(envPw, 10)
  if (process.env.ADMIN_PHONE && normPhone(process.env.ADMIN_PHONE)) admin.phone = normPhone(process.env.ADMIN_PHONE)
}
if (admin && normEmail(process.env.ADMIN_EMAIL)) admin.email = normEmail(process.env.ADMIN_EMAIL)
save()

// ---------- helpers ----------
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg })
const publicUser = (u) => ({ id: u.id, name: u.name, phone: u.phone || null, email: u.email || null, role: u.role, avatar: u.avatar || null })
const sign = (u) => jwt.sign({ id: u.id, role: u.role }, SECRET, { expiresIn: '7d' })
const hashOtp = (phone, code) => crypto.createHash('sha256').update(`${code}:${phone}:${SECRET}`).digest('hex')

function auth(req, res, next) {
  const h = req.headers.authorization || ''
  const t = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!t) return bad(res, 'Please log in.', 401)
  try {
    const p = jwt.verify(t, SECRET)
    const u = db().users.find((x) => x.id === p.id)
    if (!u) return bad(res, 'Please log in again.', 401)
    req.user = u
    next()
  } catch {
    bad(res, 'Your session has expired. Please log in again.', 401)
  }
}
const adminOnly = (req, res, next) => (req.user.role === 'admin' ? next() : bad(res, 'Admin access only.', 403))

// ---------- app ----------
const app = express()
app.set('trust proxy', 1)
app.use(helmet({ contentSecurityPolicy: false }))
app.use(express.json({ limit: '20kb' }))
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false }))
const strict = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Please try again later.' } })

// ----- auth -----
app.post('/api/auth/request-otp', strict, async (req, res) => {
  const phone = normPhone(req.body?.phone)
  if (!phone) return bad(res, 'Enter a valid mobile number like 03001234567.')
  const user = d.users.find((u) => u.phone === phone)
  if (user?.role === 'admin') return bad(res, 'This number cannot log in with OTP. Use the admin login page.', 403)
  const prev = d.otps[phone]
  if (prev && Date.now() - prev.sentAt < 60000) return bad(res, 'Please wait a minute before asking for another code.', 429)
  const code = String(crypto.randomInt(100000, 1000000))
  d.otps[phone] = { hash: hashOtp(phone, code), expires: Date.now() + 5 * 60000, attempts: 0, sentAt: Date.now() }
  save()
  try {
    await sendOtp(phone, code)
  } catch (e) {
    console.error('SMS failed:', e.message)
    delete d.otps[phone]
    save()
    return bad(res, 'Could not send the SMS. Please try again.', 502)
  }
  const out = { ok: true, isNewUser: !user }
  if (devOtp) out.devOtp = code
  res.json(out)
})

app.post('/api/auth/verify-otp', strict, (req, res) => {
  const phone = normPhone(req.body?.phone)
  const code = String(req.body?.code || '').trim()
  if (!phone || !/^\d{6}$/.test(code)) return bad(res, 'Enter the 6-digit code.')
  const rec = d.otps[phone]
  if (!rec || rec.expires < Date.now()) return bad(res, 'This code has expired. Please request a new one.')
  if (rec.attempts >= 5) {
    delete d.otps[phone]
    save()
    return bad(res, 'Too many wrong attempts. Please request a new code.', 429)
  }
  rec.attempts++
  const ok = crypto.timingSafeEqual(Buffer.from(hashOtp(phone, code)), Buffer.from(rec.hash))
  if (!ok) {
    save()
    return bad(res, 'Incorrect code. Please try again.')
  }
  let user = d.users.find((u) => u.phone === phone)
  if (!user) {
    const name = str(req.body?.name, 2, 60)
    if (!name) return bad(res, 'Please enter your name.')
    user = { id: nextId('user'), role: 'customer', name, phone, createdAt: iso() }
    d.users.push(user)
  }
  delete d.otps[phone]
  save()
  res.json({ token: sign(user), user: publicUser(user) })
})

app.post('/api/auth/admin-login', strict, (req, res) => {
  const id = String(req.body?.login ?? req.body?.phone ?? '').trim()
  const phone = normPhone(id)
  const email = normEmail(id)
  const u = d.users.find((x) => x.role === 'admin' && ((phone && x.phone === phone) || (email && x.email === email)))
  const pw = String(req.body?.password || '')
  // same work whether or not the user exists, to avoid leaking which numbers are admins
  const ok = bcrypt.compareSync(pw, u?.passwordHash || '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva')
  if (!u || !ok) return bad(res, 'Wrong phone/email or password.', 401)
  res.json({ token: sign(u), user: publicUser(u) })
})

app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.user) }))


app.post('/api/auth/signup', strict, (req, res) => {
  const name = str(req.body?.name, 2, 60)
  const email = normEmail(req.body?.email)
  const pw = String(req.body?.password || '')
  if (!name) return bad(res, 'Please enter your name.')
  if (!email) return bad(res, 'Enter a valid email address.')
  if (pw.length < 8 || pw.length > 72) return bad(res, 'Password must be 8 to 72 characters.')
  if (d.users.some((u) => u.email === email)) return bad(res, 'This email is already registered. Please log in.', 409)
  const user = { id: nextId('user'), role: 'customer', name, email, passwordHash: bcrypt.hashSync(pw, 10), emailVerified: false, createdAt: iso() }
  d.users.push(user)
  save()
  res.status(201).json({ token: sign(user), user: publicUser(user) })
})

app.post('/api/auth/login', strict, (req, res) => {
  const email = normEmail(req.body?.email)
  const pw = String(req.body?.password || '')
  const u = email && d.users.find((x) => x.email === email && x.role === 'customer')
  const ok = bcrypt.compareSync(pw, u?.passwordHash || DUMMY_HASH)
  if (u && !u.passwordHash) return bad(res, 'This account uses Google or mobile login. Please use that option.', 401)
  if (!u || !ok) return bad(res, 'Wrong email or password.', 401)
  res.json({ token: sign(u), user: publicUser(u) })
})

app.post('/api/auth/google', strict, async (req, res) => {
  if (!gClient) return bad(res, 'Google login is not set up yet.', 503)
  let p
  try {
    const t = await gClient.verifyIdToken({ idToken: String(req.body?.credential || ''), audience: process.env.GOOGLE_CLIENT_ID })
    p = t.getPayload()
  } catch {
    return bad(res, 'Google sign-in failed. Please try again.', 401)
  }
  const email = normEmail(p?.email)
  if (!email || !p.email_verified) return bad(res, 'Your Google email is not verified.', 401)
  let u = d.users.find((x) => x.googleId === p.sub) || d.users.find((x) => x.email === email)
  if (u?.role === 'admin') return bad(res, 'Please use the admin login page.', 403)
  if (!u) {
    u = { id: nextId('user'), role: 'customer', name: String(p.name || email.split('@')[0]).slice(0, 60), email, googleId: p.sub, avatar: p.picture || null, emailVerified: true, createdAt: iso() }
    d.users.push(u)
  } else {
    u.googleId = u.googleId || p.sub
    // An unverified password set by someone else for this email must not survive a verified Google link.
    if (u.passwordHash && !u.emailVerified) delete u.passwordHash
    u.emailVerified = true
  }
  save()
  res.json({ token: sign(u), user: publicUser(u) })
})

app.get('/api/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    whatsapp: String(process.env.WHATSAPP_NUMBER || '').replace(/\D/g, ''),
    storeName: process.env.STORE_NAME || 'PoultryPro',
    deliveryDays: DELIVERY,
  })
})

// ----- reviews (public read, logged-in write) -----
const published = () => d.reviews.filter((r) => r.status === 'published')
function summarize(list) {
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  list.forEach((r) => breakdown[r.rating]++)
  const average = list.length ? Math.round((list.reduce((a, r) => a + r.rating, 0) / list.length) * 10) / 10 : 0
  return { average, count: list.length, breakdown }
}
const shortName = (n) => { const p = String(n).trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0].toUpperCase()}.` : p[0] }
const pubReview = (r) => ({
  id: r.id, productId: r.productId, productName: d.products.find((p) => p.id === r.productId)?.name || null,
  name: shortName(r.name), rating: r.rating, text: r.text, verified: r.verified, createdAt: r.createdAt, reply: r.reply || null,
})
const withRatings = (p) => { const s = summarize(published().filter((r) => r.productId === p.id)); return { ...p, rating: s.average, reviews: s.count } }

app.get('/api/reviews', (req, res) => {
  const pid = Number(req.query.productId)
  if (!Number.isInteger(pid)) return bad(res, 'productId is required.')
  const list = published().filter((r) => r.productId === pid)
  res.json({ reviews: list.slice().reverse().map(pubReview), summary: summarize(list) })
})
app.get('/api/reviews/featured', (req, res) => {
  const all = published()
  res.json({ reviews: all.slice(-6).reverse().map(pubReview), summary: summarize(all) })
})
const reviewLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, message: { error: 'Too many reviews. Please try again later.' } })
app.post('/api/reviews', auth, reviewLimiter, (req, res) => {
  const rating = Number(req.body?.rating)
  const text = str(req.body?.text, 10, 500)
  const productId = req.body?.productId == null ? null : Number(req.body.productId)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return bad(res, 'Please choose a rating from 1 to 5 stars.')
  if (!text) return bad(res, 'Please write 10 to 500 characters.')
  if (productId !== null && !d.products.some((p) => p.id === productId)) return bad(res, 'Product not found.', 404)
  if (d.reviews.some((r) => r.userId === req.user.id && r.productId === productId)) return bad(res, 'You have already reviewed this. Thank you!', 409)
  const verified = d.orders.some((o) => o.userId === req.user.id && o.status === 'Delivered' && (productId === null || o.items.some((i) => i.productId === productId)))
  const r = { id: nextId('review'), productId, userId: req.user.id, name: req.user.name, rating, text, verified, status: 'published', createdAt: iso() }
  d.reviews.push(r)
  save()
  res.status(201).json({ review: pubReview(r) })
})

// ----- contact / collaborate -----
const msgLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, message: { error: 'Too many messages. Please try again later.' } })
app.post('/api/messages', msgLimiter, (req, res) => {
  const b = req.body || {}
  if (b.website) return res.json({ ok: true }) // honeypot: bots fill this hidden field
  const name = str(b.name, 2, 60)
  const email = normEmail(b.email)
  const text = str(b.message, 10, 1500)
  if (!name) return bad(res, 'Please enter your name.')
  if (!email) return bad(res, 'Enter a valid email address.')
  if (!text) return bad(res, 'Your message should be 10 to 1500 characters.')
  const m = { id: nextId('message'), name, email, text, status: 'new', replies: [], createdAt: iso() }
  d.messages.push(m)
  save()
  const to = process.env.ADMIN_EMAIL
  if (to) mail.sendMail({ to, replyTo: email, ...mail.adminNewMessage(m) }).catch((e) => console.error('Mail failed:', e.message))
  res.status(201).json({ ok: true })
})

// ----- shop -----
app.get('/api/products', (req, res) => {
  res.json({ products: d.products.filter((p) => p.active).map(withRatings) })
})

app.post('/api/orders', auth, (req, res) => {
  const b = req.body || {}
  if (!Array.isArray(b.items) || !b.items.length || b.items.length > 50) return bad(res, 'Your cart is empty.')
  const a = b.address || {}
  const name = str(a.name, 2, 60)
  const phone = normPhone(a.phone)
  const city = str(a.city, 2, 40)
  const line = str(a.line, 5, 200)
  const note = String(a.note || '').trim().slice(0, 200)
  const rawEmail = String(a.email || '').trim()
  const email = rawEmail ? normEmail(rawEmail) : req.user.email || null
  if (rawEmail && !email) return bad(res, 'Enter a valid email address or leave it empty.')
  if (!name) return bad(res, 'Enter the receiver name.')
  if (!phone) return bad(res, 'Enter a valid mobile number like 03001234567.')
  if (!city) return bad(res, 'Enter your city.')
  if (!line) return bad(res, 'Enter your full delivery address.')

  const merged = new Map()
  for (const it of b.items) {
    const id = Number(it.id), qty = Number(it.qty)
    if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1 || qty > 100) return bad(res, 'Invalid item in cart.')
    merged.set(id, (merged.get(id) || 0) + qty)
  }
  const lines = []
  for (const [id, qty] of merged) {
    const p = d.products.find((x) => x.id === id && x.active)
    if (!p) return bad(res, 'A product in your cart is no longer available.')
    if (p.stock < qty) return bad(res, `Only ${p.stock} left of "${p.name}".`)
    lines.push({ p, qty })
  }
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0)
  const tax = Math.round(subtotal * CFG.taxRate)
  const shipping = subtotal >= CFG.freeShippingOver ? 0 : CFG.shippingFee
  const seq = nextId('order')
  const order = {
    id: seq,
    number: 'PP-' + seq,
    userId: req.user.id,
    customer: { name: req.user.name, phone: req.user.phone || null, email: req.user.email || null },
    email,
    eta: { from: new Date(Date.now() + DELIVERY[0] * 864e5).toISOString(), to: new Date(Date.now() + DELIVERY[1] * 864e5).toISOString() },
    address: { name, phone, city, line, note },
    items: lines.map((l) => ({ productId: l.p.id, name: l.p.name, price: l.p.price, qty: l.qty, image: l.p.image })),
    subtotal, tax, shipping, total: subtotal + tax + shipping,
    payment: 'Cash on Delivery',
    status: 'Pending',
    history: [{ status: 'Pending', at: iso() }],
    createdAt: iso(),
  }
  for (const l of lines) l.p.stock -= l.qty
  d.orders.push(order)
  save()
  const fail = (e) => console.error('Mail failed:', e.message)
  if (email) mail.sendMail({ to: email, ...mail.orderConfirmation(order) }).catch(fail)
  if (process.env.ADMIN_EMAIL) mail.sendMail({ to: process.env.ADMIN_EMAIL, ...mail.adminNewOrder(order) }).catch(fail)
  res.status(201).json({ order, emailed: !!email && mail.emailLive() })
})

app.get('/api/orders/mine', auth, (req, res) => {
  res.json({ orders: d.orders.filter((o) => o.userId === req.user.id).slice().reverse() })
})

// ----- admin -----
const adm = express.Router()
adm.use(auth, adminOnly)

adm.get('/stats', (req, res) => {
  const open = d.orders.filter((o) => o.status !== 'Cancelled')
  const series = []
  for (let i = 13; i >= 0; i--) {
    const t = new Date(Date.now() - i * 864e5)
    series.push({ key: dayKey(t), label: t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: TZ }), sales: 0, orders: 0 })
  }
  for (const o of open) {
    const x = series.find((v) => v.key === dayKey(o.createdAt))
    if (x) { x.sales += o.total; x.orders++ }
  }
  const statusCounts = Object.fromEntries(STATUSES.map((st) => [st, d.orders.filter((o) => o.status === st).length]))
  const agg = new Map()
  for (const o of open) for (const i of o.items) {
    const c = agg.get(i.productId) || { name: i.name, qty: 0, revenue: 0 }
    c.qty += i.qty; c.revenue += i.price * i.qty; agg.set(i.productId, c)
  }
  const pub = published()
  res.json({
    totalOrders: d.orders.length,
    pending: statusCounts.Pending,
    sales: open.reduce((s2, o) => s2 + o.total, 0),
    todaySales: series[13].sales, yesterdaySales: series[12].sales,
    todayOrders: series[13].orders,
    customers: d.users.filter((u) => u.role === 'customer').length,
    unreadMessages: d.messages.filter((m) => m.status === 'new').length,
    reviews: summarize(pub),
    series, statusCounts,
    topProducts: [...agg.values()].sort((x, y) => y.qty - x.qty).slice(0, 5),
    lowStock: d.products.filter((p) => p.stock <= 5).map((p) => ({ id: p.id, name: p.name, stock: p.stock })),
    recent: d.orders.slice(-6).reverse(),
  })
})
adm.get('/badges', (req, res) => res.json({
  pending: d.orders.filter((o) => o.status === 'Pending').length,
  unreadMessages: d.messages.filter((m) => m.status === 'new').length,
}))

adm.get('/orders', (req, res) => res.json({ orders: d.orders.slice().reverse() }))

adm.patch('/orders/:id', (req, res) => {
  const o = d.orders.find((x) => x.id === Number(req.params.id))
  if (!o) return bad(res, 'Order not found.', 404)
  const s = req.body?.status
  if (!STATUSES.includes(s)) return bad(res, 'Invalid status.')
  if (['Delivered', 'Cancelled'].includes(o.status)) return bad(res, 'This order is already closed.')
  if (s === o.status) return res.json({ order: o })
  if (s === 'Cancelled') {
    for (const it of o.items) {
      const p = d.products.find((x) => x.id === it.productId)
      if (p) p.stock += it.qty
    }
  }
  o.status = s
  o.history.push({ status: s, at: iso() })
  save()
  if (o.email && s !== 'Pending') mail.sendMail({ to: o.email, ...mail.statusUpdate(o) }).catch((e) => console.error('Mail failed:', e.message))
  res.json({ order: o })
})

function cleanProduct(b) {
  const name = str(b.name, 2, 120)
  const category = str(b.category, 2, 40)
  const price = Number(b.price)
  const oldPrice = b.oldPrice === '' || b.oldPrice == null ? price : Number(b.oldPrice)
  const stock = Number(b.stock)
  if (!name) return { error: 'Product name must be 2 to 120 characters.' }
  if (!category) return { error: 'Choose a category.' }
  if (!(price > 0) || price > 10000000) return { error: 'Enter a valid price.' }
  if (!(oldPrice >= price)) return { error: 'Old price must be the same as or higher than the price.' }
  if (!Number.isInteger(stock) || stock < 0) return { error: 'Stock must be a whole number (0 or more).' }
  return {
    value: {
      name, category, price, oldPrice, stock,
      description: String(b.description || '').trim().slice(0, 500),
      image: String(b.image || '').trim().slice(0, 300),
      active: b.active !== false,
    },
  }
}
adm.get('/products', (req, res) => res.json({ products: d.products }))
adm.post('/products', (req, res) => {
  const { value, error } = cleanProduct(req.body || {})
  if (error) return bad(res, error)
  const p = { rating: 4.5, reviews: 0, ...value, id: nextId('product'), createdAt: iso() }
  d.products.push(p)
  save()
  res.status(201).json({ product: p })
})
adm.put('/products/:id', (req, res) => {
  const p = d.products.find((x) => x.id === Number(req.params.id))
  if (!p) return bad(res, 'Product not found.', 404)
  const { value, error } = cleanProduct(req.body || {})
  if (error) return bad(res, error)
  Object.assign(p, value)
  save()
  res.json({ product: p })
})
adm.delete('/products/:id', (req, res) => {
  const i = d.products.findIndex((x) => x.id === Number(req.params.id))
  if (i < 0) return bad(res, 'Product not found.', 404)
  d.products.splice(i, 1)
  save()
  res.json({ ok: true })
})

adm.get('/customers', (req, res) => {
  const rows = d.users.filter((u) => u.role === 'customer').map((u) => {
    const mine = d.orders.filter((o) => o.userId === u.id)
    return {
      id: u.id, name: u.name, email: u.email || null, phone: u.phone || null,
      via: u.googleId ? 'Google' : u.passwordHash ? 'Email' : 'Mobile OTP',
      joined: u.createdAt, orders: mine.length,
      spent: mine.filter((o) => o.status !== 'Cancelled').reduce((a, o) => a + o.total, 0),
      last: mine.length ? mine[mine.length - 1].createdAt : null,
    }
  })
  res.json({ customers: rows.reverse() })
})

adm.get('/reviews', (req, res) => {
  const rows = d.reviews.slice().reverse().map((r) => ({
    ...r, productName: d.products.find((p) => p.id === r.productId)?.name || null,
    email: d.users.find((u) => u.id === r.userId)?.email || null,
  }))
  res.json({ reviews: rows, summary: summarize(published()) })
})
adm.patch('/reviews/:id', (req, res) => {
  const r = d.reviews.find((x) => x.id === Number(req.params.id))
  if (!r) return bad(res, 'Review not found.', 404)
  if (req.body?.status !== undefined) {
    if (!['published', 'hidden'].includes(req.body.status)) return bad(res, 'Invalid status.')
    r.status = req.body.status
  }
  if (req.body?.reply !== undefined) {
    const t = String(req.body.reply).trim().slice(0, 500)
    if (t) r.reply = t; else delete r.reply
  }
  save()
  res.json({ review: r })
})
adm.delete('/reviews/:id', (req, res) => {
  const i = d.reviews.findIndex((x) => x.id === Number(req.params.id))
  if (i < 0) return bad(res, 'Review not found.', 404)
  d.reviews.splice(i, 1)
  save()
  res.json({ ok: true })
})

adm.get('/messages', (req, res) => res.json({ messages: d.messages.slice().reverse() }))
adm.patch('/messages/:id', (req, res) => {
  const m = d.messages.find((x) => x.id === Number(req.params.id))
  if (!m) return bad(res, 'Message not found.', 404)
  if (m.status === 'new') m.status = 'read'
  save()
  res.json({ message: m })
})
adm.post('/messages/:id/reply', async (req, res) => {
  const m = d.messages.find((x) => x.id === Number(req.params.id))
  if (!m) return bad(res, 'Message not found.', 404)
  const text = str(req.body?.text, 2, 3000)
  if (!text) return bad(res, 'Write your reply first.')
  let emailed = false
  try {
    emailed = await mail.sendMail({ to: m.email, replyTo: process.env.ADMIN_EMAIL || undefined, ...mail.messageReply(m, text) })
  } catch (e) {
    console.error('Reply mail failed:', e.message)
    return bad(res, 'The email could not be sent. Check your SMTP settings in .env.', 502)
  }
  m.replies.push({ text, at: iso(), emailed })
  m.status = 'replied'
  save()
  res.json({ message: m, emailed })
})
adm.delete('/messages/:id', (req, res) => {
  const i = d.messages.findIndex((x) => x.id === Number(req.params.id))
  if (i < 0) return bad(res, 'Message not found.', 404)
  d.messages.splice(i, 1)
  save()
  res.json({ ok: true })
})
app.use('/api/admin', adm)

app.use('/api', (req, res) => bad(res, 'Not found.', 404))

// ----- serve the built website (npm run build) -----
const dist = path.join(__dirname, '../dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')))
}
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return bad(res, 'Invalid request.')
  console.error(err)
  bad(res, 'Server error. Please try again.', 500)
})

const PORT = Number(process.env.PORT || 4000)
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}  (OTP mode: ${process.env.OTP_MODE || 'console'})`))
