import { Factory, PenSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getClientBranding } from '../../utils/clientBranding'

export function ClientCard({
  client,
  unitsCount,
  itemsCount,
  variant = 'selector',
  onEdit,
}) {
  const dark = variant === 'dark'
  const selector = variant === 'selector'
  const branding = getClientBranding(client)
  const shellClass = selector
    ? `border-white/10 bg-slate-950/78 hover:border-cyan-300/30 ${branding.glow}`
    : dark
      ? `border-white/10 bg-slate-950/70 ${branding.glow}`
      : 'border-white/70 bg-white/80 shadow-panel hover:shadow-2xl'

  return (
    <div
      className={`relative overflow-hidden rounded-[20px] border transition hover:-translate-y-0.5 ${selector ? 'w-[178px] p-3.5' : 'p-3.5'} ${shellClass}`}
    >
      <Link
        to={`/clientes/${client.id}`}
        aria-label={`Abrir cliente ${client.name}`}
        className="absolute inset-0 z-0"
      />
      {onEdit ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onEdit()
          }}
          className="absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/20 hover:text-white"
          aria-label={`Editar ${client.name}`}
        >
          <PenSquare className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <div className={`pointer-events-none relative z-[1] ${selector ? 'flex flex-col items-center text-center' : 'flex items-start gap-3'}`}>
        {branding.logoDataUrl ? (
          <div className={`${selector ? 'h-[88px] w-[88px] rounded-[26px]' : 'h-12 w-12 rounded-[18px] shrink-0'} overflow-hidden border border-white/10 bg-white/5 p-1`}>
            <img src={branding.logoDataUrl} alt={`Logo ${client.name}`} className="h-full w-full rounded-[inherit] object-contain" />
          </div>
        ) : (
          <div className={`flex items-center justify-center bg-gradient-to-br ${branding.gradient} font-extrabold text-white ${selector ? 'h-[88px] w-[88px] rounded-[26px] text-[2rem]' : 'h-12 w-12 rounded-[18px] text-lg shrink-0'}`}>
            {branding.logoText}
          </div>
        )}
        <div className={selector ? 'mt-3 w-full' : 'min-w-0 flex-1'}>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${dark || selector ? 'text-cyan-300' : 'text-teal-700'}`}>{client.code}</p>
          <h3 className={`mt-1 font-display ${selector ? 'text-sm leading-5' : 'text-[1.1rem] leading-6'} font-bold ${dark || selector ? 'text-white' : 'text-ink'}`}>{client.name}</h3>
          {selector ? null : (
            <p className={`mt-0.5 text-[12px] ${dark || selector ? 'text-slate-400' : 'text-slate-500'}`}>{branding.tag}</p>
          )}
        </div>
      </div>
      {!selector ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className={`rounded-xl p-2.5 ${dark ? 'bg-white/5' : 'bg-sand'}`}>
            <p className={`text-[10px] uppercase tracking-[0.14em] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Unidades</p>
            <p className={`mt-1 text-base font-bold ${dark ? 'text-white' : 'text-ink'}`}>{unitsCount}</p>
          </div>
          <div className={`rounded-xl p-2.5 ${dark ? 'bg-cyan-400/8' : 'bg-mist'}`}>
            <p className={`text-[10px] uppercase tracking-[0.14em] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Itens</p>
            <p className={`mt-1 text-base font-bold ${dark ? 'text-white' : 'text-ink'}`}>{itemsCount}</p>
          </div>
        </div>
      ) : null}
      {!selector ? (
        <>
          <div className={`pointer-events-none relative z-[1] mt-3 flex items-center gap-2 text-[12px] font-medium ${dark || selector ? 'text-slate-400' : 'text-slate-500'}`}>
            <Factory className="h-4 w-4" />
            {client.cnpj}
          </div>
        </>
      ) : null}
    </div>
  )
}
