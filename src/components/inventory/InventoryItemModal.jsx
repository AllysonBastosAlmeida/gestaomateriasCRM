import { useEffect, useState } from 'react'
import { ITEM_TYPES } from '../../utils/constants'
import { ModalShell } from '../common/ModalShell'

const initialState = {
  clientId: '',
  unitId: '',
  type: 'material',
  category: '',
  name: '',
  description: '',
  sku: '',
  serialNumber: '',
  quantity: 1,
  minQuantity: 0,
  unitMeasure: 'un',
  status: 'disponivel',
  internalLocation: '',
  notes: '',
}

export function InventoryItemModal({ open, item, clients, units, defaults, onClose, onSubmit }) {
  const [form, setForm] = useState(initialState)

  useEffect(() => {
    setForm(item ? { ...initialState, ...item } : { ...initialState, ...defaults })
  }, [item, defaults, open])

  const availableUnits = units.filter((unit) => !form.clientId || unit.clientId === form.clientId)

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={item ? 'Editar item de estoque' : 'Novo item de estoque'}
      description="Cadastre materiais e ferramentas por cliente e unidade."
      panelClassName="max-w-2xl max-h-none"
      bodyClassName="overflow-visible"
    >
      <form
        className="grid gap-2.5 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit({
            ...form,
            name: form.description.trim(),
          })
        }}
      >
        <label className="form-label-dark">
          <span className="font-medium">Cliente</span>
          <select
            value={form.clientId}
            onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value, unitId: '' }))}
            className="form-select-dark"
          >
            <option value="">Selecione</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </label>
        <label className="form-label-dark">
          <span className="font-medium">Unidade</span>
          <select
            value={form.unitId}
            onChange={(event) => setForm((current) => ({ ...current, unitId: event.target.value }))}
            className="form-select-dark"
          >
            <option value="">Selecione</option>
            {availableUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))}
          </select>
        </label>
        <label className="form-label-dark">
          <span className="font-medium">Tipo</span>
          <select
            value={form.type}
            onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
            className="form-select-dark"
          >
            {ITEM_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </label>
        <label className="form-label-dark">
          <span className="font-medium">Descricao</span>
          <input
            required
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            className="form-input-dark"
            placeholder="Descreva o item"
          />
        </label>
        <label className="form-label-dark">
          <span className="font-medium">Serial</span>
          <input
            value={form.serialNumber}
            onChange={(event) => setForm((current) => ({ ...current, serialNumber: event.target.value }))}
            className="form-input-dark"
          />
        </label>
        <label className="form-label-dark">
          <span className="font-medium">Quantidade</span>
          <input
            type="number"
            min="0"
            value={form.quantity}
            onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
            className="form-input-dark"
          />
        </label>
        <label className="form-label-dark">
          <span className="font-medium">Unidade de medida</span>
          <input
            value={form.unitMeasure}
            onChange={(event) => setForm((current) => ({ ...current, unitMeasure: event.target.value }))}
            className="form-input-dark"
          />
        </label>
        <label className="form-label-dark">
          <span className="font-medium">Localizacao interna</span>
          <input
            value={form.internalLocation}
            onChange={(event) => setForm((current) => ({ ...current, internalLocation: event.target.value }))}
            className="form-input-dark"
          />
        </label>
        <label className="form-label-dark md:col-span-2">
          <span className="font-medium">Observacoes</span>
          <textarea
            rows="1"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            className="form-textarea-dark"
          />
        </label>
        <div className="sticky bottom-0 z-[1] -mx-3 mt-1 grid grid-cols-2 gap-2 border-t border-white/10 bg-[#050b16] px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 sm:static sm:mx-0 sm:flex sm:justify-end sm:gap-3 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0 md:col-span-2">
          <button type="button" onClick={onClose} className="form-button-secondary-dark min-h-10">
            Cancelar
          </button>
          <button type="submit" className="min-h-10 rounded-xl bg-ink px-3 py-2 text-[13px] font-semibold text-white">
            Salvar
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
