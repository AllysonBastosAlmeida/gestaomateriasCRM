import { X } from 'lucide-react'

export function ModalShell({
  title,
  description,
  open,
  onClose,
  children,
  closeDisabled = false,
  overlayClassName = '',
  panelClassName = '',
  headerClassName = '',
  bodyClassName = '',
}) {
  if (!open) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-3 md:items-center ${overlayClassName}`}>
      <div className={`flex max-h-[84vh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#050b16] shadow-[0_24px_90px_rgba(0,0,0,0.5)] ${panelClassName}`}>
        <div className={`sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/10 bg-[#050b16] px-4 py-3 ${headerClassName}`}>
          <div>
            <h2 className="font-display text-lg font-extrabold text-white md:text-xl">{title}</h2>
            {description ? <p className="mt-0.5 text-[12px] text-slate-400">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            className="rounded-2xl border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className={`overflow-y-auto px-4 py-3 ${bodyClassName}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
