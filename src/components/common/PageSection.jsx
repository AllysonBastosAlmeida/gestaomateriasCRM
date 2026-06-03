export function PageSection({ eyebrow, title, description, action, children }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</p>
          ) : null}
          <h2 className="mt-0.5 font-display text-[1.9rem] font-extrabold text-white">{title}</h2>
          {description ? <p className="mt-1 max-w-3xl text-[13px] text-slate-400">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
