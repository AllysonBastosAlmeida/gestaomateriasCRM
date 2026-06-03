import { useEffect, useState } from 'react'
import { MOVEMENT_TYPES } from '../../utils/constants'
import { ModalShell } from '../common/ModalShell'

const initialState = {
  movementType: 'entrada',
  quantity: 1,
  reason: '',
  notes: '',
  destinationUnitId: '',
}

export function MovementModal({ open, item, units, onClose, onSubmit }) {
  const [form, setForm] = useState(initialState)

  useEffect(() => {
    setForm(initialState)
  }, [open, item])

  const availableUnits = units.filter((unit) => unit.id !== item?.unitId)

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Registrar movimentacao"
      description={item ? `Item selecionado: ${item.name}` : 'Selecione os parametros da movimentacao.'}
      panelClassName="max-w-xl"
    >
      <form
        className="grid gap-3 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(form)
        }}
      >
        <label className="form-label-dark">
          <span className="font-medium">Operacao</span>
          <select
            value={form.movementType}
            onChange={(event) => setForm((current) => ({ ...current, movementType: event.target.value }))}
            className="form-select-dark"
          >
            {MOVEMENT_TYPES.map((movementType) => (
              <option key={movementType.value} value={movementType.value}>{movementType.label}</option>
            ))}
          </select>
        </label>
        <label className="form-label-dark">
          <span className="font-medium">{form.movementType === 'ajuste' ? 'Novo saldo' : 'Quantidade'}</span>
          <input
            type="number"
            min="0"
            value={form.quantity}
            onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
            className="form-input-dark"
          />
        </label>
        {form.movementType === 'transferencia' ? (
          <label className="form-label-dark md:col-span-2">
            <span className="font-medium">Destino</span>
            <select
              value={form.destinationUnitId}
              onChange={(event) => setForm((current) => ({ ...current, destinationUnitId: event.target.value }))}
              className="form-select-dark"
            >
              <option value="">Selecione a unidade</option>
              {availableUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="form-label-dark md:col-span-2">
          <span className="font-medium">Motivo</span>
          <input
            value={form.reason}
            onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
            className="form-input-dark"
            placeholder="Ex.: reposicao, consumo, balanceamento"
          />
        </label>
        <label className="form-label-dark md:col-span-2">
          <span className="font-medium">Observacoes</span>
          <textarea
            rows="2"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            className="form-textarea-dark"
          />
        </label>
        <div className="md:col-span-2 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="form-button-secondary-dark">
            Cancelar
          </button>
          <button type="submit" className="rounded-xl bg-ink px-3 py-2 text-[13px] font-semibold text-white">
            Registrar
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
