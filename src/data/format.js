export const showPhone = (p) => (p ? '0' + String(p).slice(2) : '')
export const fmtDay = (iso) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
export const fmtDate = (iso) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
export const daysFromNow = (n) => new Date(Date.now() + n * 864e5).toISOString()
