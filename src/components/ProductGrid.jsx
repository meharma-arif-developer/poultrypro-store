import ProductCard from './ProductCard'

export default function ProductGrid({ products, wishlist, onWish, onAdd, onOpen }) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center text-slate-600">
        No products match your search. Try a different keyword or category.
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} wished={wishlist.includes(p.id)}
          onWish={() => onWish(p.id)} onAdd={() => onAdd(p.id)} onOpen={() => onOpen(p)} />
      ))}
    </div>
  )
}
