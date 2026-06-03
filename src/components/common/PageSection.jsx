export function PageSection({ eyebrow, title, description, action, children }) {
  return (
    <section className="space-y-2.5 sm:space-y-3">
      <div className="flex flex-col gap-2 sm:gap-2.5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</p>
          ) : null}
          <h2 className="mt-0.5 font-display text-[1.5rem] font-extrabold leading-tight text-white sm:text-[1.9rem]">{title}</h2>
          {description ? <p className="mt-1 max-w-3xl text-[12px] leading-5 text-slate-400 sm:text-[13px]">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
