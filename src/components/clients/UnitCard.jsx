import { MapPin, Package2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export function UnitCard({ unit, itemsCount }) {
  return (
    <Link
      to={`/unidades/${unit.id}`}
      className="rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{unit.code}</p>
          <h3 className="mt-2 font-display text-lg font-bold text-white">{unit.name}</h3>
          <p className="mt-1 text-sm text-slate-400">{unit.city} / {unit.state}</p>
        </div>
        <div className="rounded-2xl bg-cyan-400/10 p-3">
          <Package2 className="h-5 w-5 text-cyan-300" />
        </div>
      </div>
      <div className="mt-4 rounded-2xl bg-white/5 p-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Itens locais</p>
        <p className="mt-1 text-lg font-bold text-white">{itemsCount}</p>
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
        <MapPin className="h-4 w-4" />
        {unit.address}
      </div>
    </Link>
  )
}
