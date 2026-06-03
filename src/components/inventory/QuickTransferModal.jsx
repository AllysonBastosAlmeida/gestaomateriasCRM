import { useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { ModalShell } from '../common/ModalShell'

export function QuickTransferModal({ open, item, units, onClose, onSubmit }) {
  const [destinationUnitId, setDestinationUnitId] = useState('')

  const availableUnits = useMemo(
    () => units.filter((unit) => unit.id !== item?.unitId),
    [item?.unitId, units],
  )

  useEffect(() => {
    setDestinationUnitId(availableUnits[0]?.id || '')
  }, [availableUnits, open])

  if (!item) return null

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Mover item"
      description="Remanejamento rapido para outra unidade. Ideal para uso no celular."
      panelClassName="max-w-sm rounded-[22px] border-white/15 bg-[#050b16]"
      headerClassName="px-3.5 py-3"
      bodyClassName="px-3.5 py-3"
    >
      <form
        className="space-y-2.5"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit({
            movementType: 'transferencia',
            destinationUnitId,
            quantity: item.quantity,
            reason: 'Remanejamento rapido pelo workspace',
            notes: '',
          })
        }}
      >
        <div className="rounded-xl border border-white/10 bg-[#0f1726] p-2.5">
          <p className="text-[13px] font-semibold text-white">{item.name}</p>
          <p className="mt-1 text-[12px] text-slate-400">
            {item.quantity} {item.unitMeasure} sera movido integralmente para outra unidade.
          </p>
        </div>

        <label className="form-label-dark">
          <span className="font-medium">Destino</span>
          <select
            value={destinationUnitId}
            onChange={(event) => setDestinationUnitId(event.target.value)}
            className="form-select-dark"
          >
            <option value="">Selecione a unidade</option>
            {availableUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))}
          </select>
        </label>

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="form-button-secondary-dark">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!destinationUnitId}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-3 py-2 text-[13px] font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Mover agora
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
