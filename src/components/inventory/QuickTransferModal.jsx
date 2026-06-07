import { useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft, Building2 } from 'lucide-react'
import { ModalShell } from '../common/ModalShell'

export function QuickTransferModal({ open, item, units, clients, onClose, onSubmit }) {
  const [destinationUnitId, setDestinationUnitId] = useState('')
  const [crossClientMode, setCrossClientMode] = useState(false)
  const [destinationClientId, setDestinationClientId] = useState('')

  const sameClientUnits = useMemo(
    () => units.filter((unit) => unit.clientId === item?.clientId && unit.id !== item?.unitId),
    [item?.clientId, item?.unitId, units],
  )

  const availableClients = useMemo(
    () => clients.filter((client) => client.id !== item?.clientId),
    [clients, item?.clientId],
  )

  const crossClientUnits = useMemo(
    () => units.filter((unit) => unit.clientId === destinationClientId && unit.id !== item?.unitId),
    [destinationClientId, item?.unitId, units],
  )

  useEffect(() => {
    setCrossClientMode(false)
    setDestinationClientId(availableClients[0]?.id || '')
    setDestinationUnitId(sameClientUnits[0]?.id || '')
  }, [availableClients, open, sameClientUnits])

  useEffect(() => {
    if (!crossClientMode) {
      setDestinationUnitId(sameClientUnits[0]?.id || '')
      return
    }

    setDestinationUnitId(crossClientUnits[0]?.id || '')
  }, [crossClientMode, sameClientUnits, crossClientUnits])

  if (!item) return null

  const visibleUnits = crossClientMode ? crossClientUnits : sameClientUnits

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

        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0f1726] px-2.5 py-2">
          <div>
            <p className="text-[11px] font-semibold text-white">{crossClientMode ? 'Movendo para outro cliente' : 'Movendo dentro do cliente atual'}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {crossClientMode ? 'Selecione o cliente e a fabrica de destino.' : 'Selecione apenas a fabrica de destino.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCrossClientMode((current) => !current)}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-[12px] font-semibold text-slate-200"
          >
            <Building2 className="h-3.5 w-3.5" />
            {crossClientMode ? 'Mesmo cliente' : 'Outro cliente'}
          </button>
        </div>

        {crossClientMode ? (
          <label className="form-label-dark">
            <span className="font-medium">Cliente</span>
            <select
              value={destinationClientId}
              onChange={(event) => setDestinationClientId(event.target.value)}
              className="form-select-dark"
            >
              <option value="">Selecione o cliente</option>
              {availableClients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="form-label-dark">
          <span className="font-medium">{crossClientMode ? 'Fabrica de destino' : 'Destino'}</span>
          <select
            value={destinationUnitId}
            onChange={(event) => setDestinationUnitId(event.target.value)}
            className="form-select-dark"
          >
            <option value="">Selecione a unidade</option>
            {visibleUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))}
          </select>
        </label>

        <div className="sticky bottom-0 z-[1] -mx-3.5 mt-1 grid grid-cols-2 gap-2 border-t border-white/10 bg-[#050b16] px-3.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 sm:static sm:mx-0 sm:flex sm:justify-end sm:gap-3 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-1">
          <button type="button" onClick={onClose} className="form-button-secondary-dark min-h-10">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!destinationUnitId}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-3 py-2 text-[13px] font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Mover agora
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
