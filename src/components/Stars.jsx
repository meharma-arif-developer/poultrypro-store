import { Star } from 'lucide-react'

export default function Stars({ value = 0, className = 'h-4 w-4' }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${className} ${n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
      ))}
    </span>
  )
}

export function StarInput({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Your rating" className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)} className="flex h-11 w-11 items-center justify-center">
          <Star className={`h-8 w-8 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
        </button>
      ))}
    </div>
  )
}
