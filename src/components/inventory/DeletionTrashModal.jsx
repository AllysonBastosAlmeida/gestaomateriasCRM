import { RotateCcw, Trash2 } from 'lucide-react'
import { ModalShell } from '../common/ModalShell'
import { formatDateTime } from '../../utils/date'
import { DELETION_REQUEST_TYPES } from '../../services/inventoryDeletionRequests'

export function DeletionTrashModal({ open, requests, onClose, onRestore }) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Lixeira"
      description="Itens enviados para exclusao por voce e ainda aguardando aprovacao final."
      panelClassName="max-w-lg rounded-[22px] border-white/15 bg-[#050b16]"
      headerClassName="px-3.5 py-3"
      bodyClassName="px-3.5 py-3"
    >
      {requests.length ? (
        <div className="space-y-2.5">
          {requests.map((request) => (
            <div key={request.id} className="rounded-2xl border border-white/10 bg-[#0f1726] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 shrink-0 text-rose-300" />
                    <p className="truncate text-[13px] font-semibold text-white">{request.itemName}</p>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {request.requestType === DELETION_REQUEST_TYPES.unit ? 'Unidade' : 'Item'} • {formatDateTime(request.requestedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRestore(request)}
                  className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-2 text-[12px] font-semibold text-emerald-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restaurar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-center text-[13px] text-slate-400">
          Nenhum item seu esta aguardando exclusao neste cliente.
        </div>
      )}
    </ModalShell>
  )
}
