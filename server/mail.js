import nodemailer from 'nodemailer'

const STORE = () => process.env.STORE_NAME || 'PoultryPro'
const TZ = () => process.env.TIMEZONE || 'Asia/Karachi'
export const SITE = () => (process.env.SITE_URL || 'http://localhost:5173').replace(/\/$/, '')
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const money = (n) => 'Rs ' + Math.round(n).toLocaleString('en-US')
const day = (iso) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ() })
const when = (iso) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: TZ() })
const phoneShow = (p) => (p ? '0' + String(p).slice(2) : '')

let transport
export const emailLive = () => !!process.env.SMTP_HOST
function getTransport() {
  if (transport) return transport
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  transport = SMTP_HOST
    ? nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT || 587), secure: Number(SMTP_PORT) === 465, auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined })
    : nodemailer.createTransport({ jsonTransport: true })
  return transport
}

// Returns true if a real email was sent, false if SMTP is not configured (message only logged).
export async function sendMail({ to, subject, html, text, replyTo }) {
  const from = process.env.MAIL_FROM || `"${STORE()}" <${process.env.SMTP_USER || 'no-reply@localhost'}>`
  await getTransport().sendMail({ from, to, subject, html, text, replyTo })
  if (!emailLive()) console.log(`[EMAIL not sent: SMTP not set] to=${to} subject="${subject}"`)
  return emailLive()
}

const layout = (title, inner) => `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#14301F">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#14301F;color:#ffffff;padding:20px 24px;font-size:22px;font-weight:bold">${esc(STORE())}</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.6"><h1 style="margin:0 0 12px;font-size:22px">${esc(title)}</h1>${inner}</td></tr>
<tr><td style="padding:16px 24px;background:#f8fafc;color:#64748b;font-size:12px">${esc(STORE())} · ${esc(process.env.STORE_PHONE || '')} · ${esc(process.env.STORE_EMAIL || '')}</td></tr>
</table></td></tr></table></body></html>`

const itemsTable = (o) => `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:12px 0">
${o.items.map((i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0">${esc(i.name)} × ${i.qty}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #e2e8f0">${money(i.price * i.qty)}</td></tr>`).join('')}
<tr><td style="padding:6px 0;color:#64748b">Subtotal</td><td align="right">${money(o.subtotal)}</td></tr>
${o.tax ? `<tr><td style="padding:6px 0;color:#64748b">Tax</td><td align="right">${money(o.tax)}</td></tr>` : ''}
<tr><td style="padding:6px 0;color:#64748b">Delivery</td><td align="right">${o.shipping === 0 ? 'Free' : money(o.shipping)}</td></tr>
<tr><td style="padding:10px 0;font-weight:bold;font-size:17px">Total (${esc(o.payment)})</td><td align="right" style="font-weight:bold;font-size:17px">${money(o.total)}</td></tr></table>`

const itemsText = (o) => o.items.map((i) => `- ${i.name} x ${i.qty}: ${money(i.price * i.qty)}`).join('\n') +
  `\nSubtotal: ${money(o.subtotal)}\nDelivery: ${o.shipping === 0 ? 'Free' : money(o.shipping)}\nTotal (${o.payment}): ${money(o.total)}`
const addrHtml = (o) => `${esc(o.address.name)}<br>${esc(phoneShow(o.address.phone))}<br>${esc(o.address.line)}, ${esc(o.address.city)}${o.address.note ? `<br><i>Note: ${esc(o.address.note)}</i>` : ''}`
const eta = (o) => `${day(o.eta.from)} to ${day(o.eta.to)}`
const btn = (href, label) => `<p style="margin:20px 0"><a href="${esc(href)}" style="background:#F5B83D;color:#14301F;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px;display:inline-block">${esc(label)}</a></p>`

export function orderConfirmation(o) {
  const subject = `Order confirmation: ${o.number}`
  const html = layout(`Thank you, ${o.address.name.split(' ')[0]}!`,
    `<p>Your order <b>${esc(o.number)}</b> has been placed successfully on ${esc(when(o.createdAt))}. Our team will call you shortly to confirm your delivery details.</p>
<p style="background:#ecfdf5;border-radius:8px;padding:12px 14px"><b>Estimated delivery:</b> ${esc(eta(o))}<br><b>Payment:</b> ${esc(o.payment)}. Please keep ${money(o.total)} ready.</p>
<h3 style="margin:18px 0 0">Order details</h3>${itemsTable(o)}
<h3 style="margin:18px 0 4px">Delivery address</h3><p style="margin:0">${addrHtml(o)}</p>
${btn(SITE() + '/orders', 'Track my order')}<p style="color:#64748b;font-size:13px">Need help? Just reply to this email or message us on WhatsApp.</p>`)
  const text = `Thank you! Your order ${o.number} has been placed successfully.\nWe will call you shortly to confirm delivery.\n\nEstimated delivery: ${eta(o)}\n\n${itemsText(o)}\n\nDeliver to:\n${o.address.name}, ${phoneShow(o.address.phone)}\n${o.address.line}, ${o.address.city}\n\nTrack your order: ${SITE()}/orders`
  return { subject, html, text }
}

export function adminNewOrder(o) {
  const subject = `New order ${o.number}: ${money(o.total)}`
  const html = layout('You have a new order',
    `<p><b>${esc(o.number)}</b> · ${esc(when(o.createdAt))}</p>
<p><b>Customer:</b> ${esc(o.address.name)}<br><b>Phone:</b> ${esc(phoneShow(o.address.phone))}<br><b>Email:</b> ${esc(o.email || 'not given')}</p>
${itemsTable(o)}<h3 style="margin:18px 0 4px">Deliver to</h3><p style="margin:0">${addrHtml(o)}</p>
<p><b>Promised delivery:</b> ${esc(eta(o))}</p>${btn(SITE() + '/admin/orders', 'Open in admin panel')}`)
  const text = `New order ${o.number}\n${o.address.name} ${phoneShow(o.address.phone)} ${o.email || ''}\n\n${itemsText(o)}\n\nDeliver to: ${o.address.line}, ${o.address.city}\nOpen: ${SITE()}/admin/orders`
  return { subject, html, text }
}

const STATUS_COPY = {
  Confirmed: 'Good news! Your order has been confirmed and is being prepared.',
  Shipped: 'Your order is on its way to you.',
  Delivered: 'Your order has been delivered. Thank you for shopping with us! We would love to hear what you think, so please leave a review on our website.',
  Cancelled: 'Your order has been cancelled. If you did not ask for this, please contact us.',
}
export function statusUpdate(o) {
  const subject = `Order ${o.number} is now ${o.status}`
  const msg = STATUS_COPY[o.status] || `Your order status is now ${o.status}.`
  const html = layout(`Order ${o.number}: ${o.status}`,
    `<p>${esc(msg)}</p>${['Confirmed', 'Shipped'].includes(o.status) ? `<p><b>Estimated delivery:</b> ${esc(eta(o))}</p>` : ''}${itemsTable(o)}${btn(SITE() + '/orders', 'View my order')}`)
  return { subject, html, text: `${msg}\n\n${itemsText(o)}\n\nView: ${SITE()}/orders` }
}

export function adminNewMessage(m) {
  const html = layout('New message from your website',
    `<p><b>${esc(m.name)}</b> (${esc(m.email)}) wrote:</p><blockquote style="margin:0;padding:12px 14px;background:#f1f5f9;border-radius:8px;white-space:pre-wrap">${esc(m.text)}</blockquote>${btn(SITE() + '/admin/messages', 'Read and reply')}`)
  return { subject: `New message from ${m.name}`, html, text: `${m.name} <${m.email}>\n\n${m.text}\n\nReply: ${SITE()}/admin/messages` }
}

export function messageReply(m, reply) {
  const html = layout(`Hello ${m.name.split(' ')[0]},`,
    `<p style="white-space:pre-wrap">${esc(reply)}</p><hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0"><p style="color:#64748b;font-size:13px">Your message on ${esc(when(m.createdAt))}:</p><blockquote style="margin:0;padding:10px 14px;background:#f8fafc;border-radius:8px;color:#475569;white-space:pre-wrap">${esc(m.text)}</blockquote>`)
  return { subject: `Re: your message to ${STORE()}`, html, text: `${reply}\n\n---\nYour message:\n${m.text}` }
}
