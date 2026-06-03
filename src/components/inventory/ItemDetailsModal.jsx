import { ArrowRightLeft, PenSquare, Trash2 } from 'lucide-react'
import { ModalShell } from '../common/ModalShell'
import { formatDateTime } from '../../utils/date'

function statusTone(status) {
  switch (status) {
    case 'disponivel':
      return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
    case 'manutencao':
      return 'border-amber-400/20 bg-amber-400/10 text-amber-200'
    case 'em_uso':
      return 'border-sky-400/20 bg-sky-400/10 text-sky-200'
    default:
      return 'border-white/10 bg-white/5 text-slate-300'
  }
}

export function ItemDetailsModal({ open, item, unitName, history, onClose, onEdit, onMove, onDelete }) {
  if (!item) return null

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={item.name}
      description="Detalhes completos do item selecionado."
      panelClassName="max-w-xl rounded-[24px] bg-slate-950 border-white/15"
      headerClassName="px-4 py-3"
      bodyClassName="px-4 py-3"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-[#0f1726] p-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
            <div className="mt-1.5">
              <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${statusTone(item.status)}`}>
                {item.status}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Saldo</p>
            <p className="mt-1.5 text-base font-semibold text-white">{item.quantity} {item.unitMeasure}</p>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#0f1726] p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Unidade</p>
            <p className="mt-1.5 text-sm font-semibold text-white">{unitName || '-'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0f1726] p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tipo</p>
            <p className="mt-1.5 text-sm font-semibold text-white">{item.type}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0f1726] p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Categoria</p>
            <p className="mt-1.5 text-sm font-semibold text-white">{item.category || '-'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0f1726] p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Quantidade minima</p>
            <p className="mt-1.5 text-sm font-semibold text-white">{item.minQuantity} {item.unitMeasure}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f1726] p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Localizacao</p>
          <p className="mt-1.5 text-[13px] text-slate-300">{item.internalLocation || 'Sem localizacao interna'}</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">SKU</p>
              <p className="mt-1 text-slate-300">{item.sku || '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Serial</p>
              <p className="mt-1 text-slate-300">{item.serialNumber || '-'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f1726] p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Observacoes</p>
          <p className="mt-1.5 text-[13px] leading-5 text-slate-300">{item.notes || 'Sem observacoes cadastradas.'}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f1726] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Ultimas movimentacoes</p>
            <div className="flex items-center gap-2">
              {onMove ? (
                <button
                  type="button"
                  onClick={onMove}
                  className="inline-flex items-center gap-1 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Mover
                </button>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-400/20 bg-rose-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </button>
              ) : null}
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300"
              >
                <PenSquare className="h-3.5 w-3.5" />
                Editar
              </button>
            </div>
          </div>
          <div className="mt-2.5 space-y-2">
            {history.length ? history.map((movement) => (
              <div key={movement.id} className="rounded-2xl bg-slate-900 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">{movement.movementType}</p>
                  <p className="text-[11px] text-slate-500">{formatDateTime(movement.performedAt)}</p>
                </div>
                <p className="mt-1 text-[13px] text-slate-300">
                  {movement.previousQuantity} → {movement.newQuantity} • {movement.quantity} mov.
                </p>
                <p className="mt-1 text-[12px] text-slate-500">{movement.reason || 'Sem motivo informado'}</p>
              </div>
            )) : (
              <div className="rounded-2xl bg-slate-950/55 px-3 py-3 text-[13px] text-slate-500">
                Ainda nao ha movimentacoes registradas para este item.
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalShell>
  )
}
