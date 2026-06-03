export function Breadcrumbs({ pathname }) {
  const segments = pathname.split('/').filter(Boolean)
  const items = [{ label: 'Workspace' }]

  if (segments.length === 0) {
    items.push({ label: 'Clientes' })
  } else {
    segments.forEach((segment) => {
      const normalized = segment.replace(/-/g, ' ')
      items.push({ label: normalized.charAt(0).toUpperCase() + normalized.slice(1) })
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
      {items.map((item, index) => (
        <div key={`${item.label}_${index}`} className="flex items-center gap-2">
          <span className={index === items.length - 1 ? 'font-semibold text-white' : 'text-slate-400'}>{item.label}</span>
          {index < items.length - 1 ? <span>/</span> : null}
        </div>
      ))}
    </div>
  )
}
