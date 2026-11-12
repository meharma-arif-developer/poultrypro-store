import { CATEGORIES } from '../data/products'

export default function CategoryTabs({ category, setCategory }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {['All', ...CATEGORIES].map((c) => (
        <button
          key={c}
          onClick={() => setCategory(c)}
          aria-pressed={category === c}
          className={`min-h-[44px] rounded-full border px-5 text-sm font-semibold transition-colors ${
            category === c ? 'border-ink bg-ink text-white' : 'border-slate-300 bg-white hover:border-ink'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  )
}
