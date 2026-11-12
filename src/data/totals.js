import { STORE } from './store'

// items: [{ price, qty }]
export function calcTotals(items) {
  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0)
  const tax = Math.round(subtotal * STORE.taxRate)
  const shipping = subtotal === 0 || subtotal >= STORE.freeShippingOver ? 0 : STORE.shippingFee
  return { subtotal, tax, shipping, total: subtotal + tax + shipping, taxRate: STORE.taxRate }
}
