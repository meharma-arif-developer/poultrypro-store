import { Truck, Banknote, ShieldCheck, Headphones } from 'lucide-react'

const FEATURES = [
  { icon: Truck, title: 'Farm Delivery', text: 'Reliable delivery to your farm, with free delivery on large orders.' },
  { icon: Banknote, title: 'Easy Payment', text: 'Pay by cash on delivery, bank transfer or mobile wallet.' },
  { icon: ShieldCheck, title: 'Quality Checked', text: 'Feed and equipment from trusted brands, checked before dispatch.' },
  { icon: Headphones, title: 'Farm Support', text: 'Friendly advice on feed, hatching and brooding whenever you need it.' },
]

export default function Features() {
  return (
    <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-16 pt-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
      {FEATURES.map(({ icon: Icon, title, text }) => (
        <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-ink"><Icon className="h-5 w-5 text-volt" /></div>
          <h3 className="mb-1 font-display text-lg font-bold">{title}</h3>
          <p className="text-sm leading-relaxed text-slate-600">{text}</p>
        </div>
      ))}
    </section>
  )
}
