export function StatsCards({ items }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-panel">
          <p className="text-sm text-slate-500">{item.label}</p>
          <div className="mt-4 flex items-end justify-between gap-3">
            <p className="font-display text-3xl font-extrabold text-ink">{item.value}</p>
            <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              {item.helper}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
