export function EmptyState({ title, description }) {
  return (
    <div className="rounded-[28px] border border-dashed border-white/10 bg-slate-950/45 p-8 text-center">
      <h3 className="font-display text-xl font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  )
}
