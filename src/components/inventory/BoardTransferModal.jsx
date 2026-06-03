import { useEffect, useState } from 'react'
import { ModalShell } from '../common/ModalShell'

export function BoardTransferModal({ open, item, destinationUnit, onClose, onSubmit }) {
  const [form, setForm] = useState({
    quantity: 1,
    reason: 'Transferencia entre unidades',
    notes: '',
  })

  useEffect(() => {
    if (!open || !item) return
    setForm({
      quantity: Number(item.quantity) || 1,
      reason: 'Transferencia entre unidades',
      notes: '',
    })
  }, [open, item])

  if (!item || !destinationUnit) return null

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Mover item entre unidades"
      description={`Defina a quantidade que deve sair de ${item.unitName || 'origem'} para ${destinationUnit.name}.`}
    >
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(form)
        }}
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
          <p className="font-semibold text-white">{item.name}</p>
          <p className="mt-1 text-sm text-slate-400">
            Saldo atual: {item.quantity} {item.unitMeasure} • Destino: {destinationUnit.name}
          </p>
        </div>
        <label className="space-y-2 text-sm text-slate-300">
          <span className="font-medium">Quantidade</span>
          <input
            type="number"
            min="1"
            max={item.quantity}
            value={form.quantity}
            onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-300">
          <span className="font-medium">Motivo</span>
          <input
            value={form.reason}
            onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
          <span className="font-medium">Observacoes</span>
          <textarea
            rows="4"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
          />
        </label>
        <div className="flex justify-end gap-3 md:col-span-2">
          <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 px-4 py-2 font-semibold text-slate-300">
            Cancelar
          </button>
          <button type="submit" className="rounded-2xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950">
            Confirmar transferencia
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
