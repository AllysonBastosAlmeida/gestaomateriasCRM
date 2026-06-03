import { useMemo, useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'

export function FiltersBar({
  filters = [],
  children,
  defaultExpanded = false,
  toggleLabel = 'Filtros',
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const activeCount = useMemo(
    () => filters.filter((filter) => String(filter.value || '').trim()).length,
    [filters],
  )

  return (
    <div className="rounded-[22px] border border-white/10 bg-slate-950/45 p-2.5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-semibold text-slate-200 transition hover:border-white/20 hover:text-white"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-300" />
          {toggleLabel}
          {activeCount ? <span className="text-cyan-300">({activeCount})</span> : null}
          <ChevronDown className={`h-3.5 w-3.5 transition ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {activeCount ? (
          <button
            type="button"
            onClick={() => {
              filters.forEach((filter) => filter.onChange(''))
            }}
            className="text-[11px] font-medium text-slate-400 transition hover:text-white"
          >
            Limpar
          </button>
        ) : null}
      </div>

      {expanded ? (
        <div className="mt-2.5 space-y-2.5 border-t border-white/10 pt-2.5">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            {filters.map((filter) => (
              <label key={filter.name} className="form-label-dark">
                <span className="font-medium text-[11px] text-slate-400">{filter.label}</span>
                <select
                  value={filter.value}
                  onChange={(event) => filter.onChange(event.target.value)}
                  className="form-select-dark px-3 py-2"
                >
                  <option value="">{filter.emptyLabel || 'Todos'}</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {children ? <div>{children}</div> : null}
        </div>
      ) : null}
    </div>
  )
}
