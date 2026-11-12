import { STORE } from '../data/store'

export default function Hero() {
  return (
    <section id="top" className="bg-gradient-to-br from-ink to-green-900 px-4 py-16 text-white sm:px-6 sm:py-20">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-10">
        <div className="min-w-0 flex-1 basis-96">
          <span className="inline-block rounded-full bg-volt px-3 py-1.5 text-sm font-bold text-ink">
            Season Sale: up to 20% off
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-6xl">
            Everything your poultry farm needs.
          </h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-slate-200">
            Quality feed, feeders and drinkers, incubators and brooding equipment, delivered to your farm at fair prices.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#shop" className="inline-flex min-h-[44px] items-center rounded-xl bg-volt px-6 font-bold text-ink hover:bg-amber-300">Shop Now</a>
            <a href="#shop" className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 px-6 font-semibold hover:border-volt">View Equipment</a>
          </div>
        </div>
        <div className="grid min-w-0 flex-1 basis-72 grid-cols-2 gap-4">
          <div className="rounded-2xl border border-green-800 bg-green-950/60 p-6">
            <div className="font-display text-4xl font-bold text-volt">20%</div>
            <div className="mt-1 text-slate-200">off Incubators</div>
          </div>
          <div className="rounded-2xl border border-green-800 bg-green-950/60 p-6">
            <div className="font-display text-4xl font-bold text-volt">Fresh</div>
            <div className="mt-1 text-slate-200">feed stock weekly</div>
          </div>
          <div className="col-span-2 rounded-2xl border border-green-800 bg-green-950/60 p-6">
            <div className="font-display text-2xl font-bold">Free delivery over {STORE.currency} {STORE.freeShippingOver.toLocaleString('en-US')}</div>
            <div className="mt-1 text-slate-200">Straight to your farm</div>
          </div>
        </div>
      </div>
    </section>
  )
}
