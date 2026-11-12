import { Heart } from 'lucide-react'
import { money } from '../data/products'
import Stars from './Stars'
import ProductImage from './ProductImage'

export default function ProductCard({ product, wished, onWish, onAdd, onOpen }) {
  const off = Math.round((1 - product.price / product.oldPrice) * 100)
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
      <div className="relative h-52 bg-slate-200">
        <button onClick={onOpen} aria-label={`View ${product.name}`} className="block h-full w-full"><ProductImage src={product.image} alt={product.name} /></button>
        {off > 0 && <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-volt">-{off}%</span>}
        <button aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={wished} onClick={onWish}
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow">
          <Heart className={`h-5 w-5 text-rose-600 ${wished ? 'fill-rose-600' : ''}`} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-xs font-semibold text-green-700">{product.category}</div>
        <h3 className="font-display text-lg font-bold leading-snug"><button onClick={onOpen} className="text-left hover:underline">{product.name}</button></h3>
        <p className="line-clamp-2 text-sm leading-snug text-slate-600">{product.description}</p>
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          {product.reviews > 0 ? (<><Stars value={product.rating} className="h-3.5 w-3.5" /><span>{product.rating} ({product.reviews})</span></>) : <span>No reviews yet</span>}
        </div>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-2xl font-bold">{money(product.price)}</span>
          {off > 0 && <span className="text-sm text-slate-500 line-through">{money(product.oldPrice)}</span>}
        </div>
        {product.stock > 0 && product.stock <= 5 && <p className="text-xs font-semibold text-red-700">Only {product.stock} left</p>}
        <button onClick={onAdd} disabled={product.stock <= 0}
          className="min-h-[44px] rounded-lg bg-ink font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600">
          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </article>
  )
}
