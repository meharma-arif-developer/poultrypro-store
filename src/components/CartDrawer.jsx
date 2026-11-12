import { X, Minus, Plus } from 'lucide-react'
import { money } from '../data/products'
import { calcTotals } from '../data/totals'


export default function CartDrawer({ open, onClose, items, onQty, onRemove, onCheckout }) {
  const { subtotal, tax, shipping, total, taxRate: TAX_RATE } = calcTotals(items)
  const count = items.reduce((a, i) => a + i.qty, 0)

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div onClick={onClose}
        className={`absolute inset-0 bg-ink/60 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside role="dialog" aria-label="Shopping cart"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 className="font-display text-2xl font-bold">Your cart ({count})</h2>
          <button aria-label="Close cart" onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {items.length === 0 && <p className="py-10 text-center text-slate-600">Your cart is empty. Add a gadget to get started.</p>}
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-3">
              <img src={i.image} alt="" className="h-16 w-16 flex-none rounded-xl bg-slate-200 object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{i.name}</div>
                <div className="mb-1 text-sm text-slate-600">{money(i.price * i.qty)}</div>
                <div className="flex items-center gap-2">
                  <button aria-label="Decrease quantity" onClick={() => onQty(i.id, i.qty - 1)}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300"><Minus className="h-4 w-4" /></button>
                  <span className="min-w-[20px] text-center font-semibold">{i.qty}</span>
                  <button aria-label="Increase quantity" onClick={() => onQty(i.id, i.qty + 1)}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300"><Plus className="h-4 w-4" /></button>
                  <button onClick={() => onRemove(i.id)} className="ml-auto min-h-[44px] text-sm font-semibold text-red-700">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-slate-200 p-5 text-[15px]">
          <Row label="Subtotal" value={money(subtotal)} />
          {TAX_RATE > 0 && <Row label={`Tax (${Math.round(TAX_RATE * 100)}%)`} value={money(tax)} />}
          <Row label="Shipping" value={shipping === 0 && subtotal > 0 ? 'Free' : money(shipping)} />
          <div className="flex justify-between pt-1 text-xl font-bold"><span>Total</span><span>{money(total)}</span></div>
          <button disabled={items.length === 0} onClick={onCheckout}
            className="mt-3 min-h-[52px] w-full rounded-xl bg-ink font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">
            Proceed to Checkout
          </button>
        </div>
      </aside>
    </div>
  )
}

function Row({ label, value }) {
  return <div className="flex justify-between"><span>{label}</span><span>{value}</span></div>
}
