import { Pencil, Repeat, Trash2 } from 'lucide-react'

export function InventoryTable({ items, unitMap, clientMap, onEdit, onMove, onDeactivate, onSelectItem }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/60 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-[13px]">
          <thead className="bg-white/[0.03]">
            <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-slate-400">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Cliente / Unidade</th>
              <th className="px-4 py-3">Qtd.</th>
              <th className="px-4 py-3">Localizacao</th>
              <th className="px-4 py-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {items.map((item) => (
              <tr
                key={item.id}
                className="cursor-pointer transition hover:bg-white/[0.03]"
                onClick={() => onSelectItem?.(item)}
              >
                <td className="px-4 py-3">
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {item.category ? `${item.category} / ${item.type}` : item.type}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-200">{clientMap[item.clientId]?.name || '-'}</p>
                  <p className="text-[11px] text-slate-400">{unitMap[item.unitId]?.name || '-'}</p>
                </td>
                <td className="px-4 py-3 font-semibold text-white">
                  {item.quantity} {item.unitMeasure}
                </td>
                <td className="px-4 py-3 text-slate-400">{item.internalLocation || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onMove(item)
                      }}
                      className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200"
                    >
                      <Repeat className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onEdit(item)
                      }}
                      className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:border-white/20 hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onDeactivate(item)
                      }}
                      className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:border-rose-300/40 hover:text-rose-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
