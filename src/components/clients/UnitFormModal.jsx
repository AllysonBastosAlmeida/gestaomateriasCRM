import { useEffect, useState } from 'react'
import { ModalShell } from '../common/ModalShell'

const initialState = {
  clientId: '',
  name: '',
  code: '',
  address: '',
  city: '',
  state: '',
  notes: '',
}

export function UnitFormModal({ open, unit, clientId, onClose, onSubmit }) {
  const [form, setForm] = useState(initialState)

  useEffect(() => {
    setForm(unit ? { ...initialState, ...unit } : { ...initialState, clientId: clientId || '' })
  }, [unit, clientId, open])

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={unit ? 'Editar unidade' : 'Nova unidade'}
      description="Registre a unidade, fabrica ou base operacional do cliente."
    >
      <form
        className="grid gap-3 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(form)
        }}
      >
        {[
          ['name', 'Nome da unidade'],
          ['code', 'Codigo'],
          ['address', 'Endereco'],
          ['city', 'Cidade'],
          ['state', 'Estado'],
        ].map(([name, label]) => (
          <label key={name} className="form-label-dark">
            <span className="font-medium">{label}</span>
            <input
              value={form[name]}
              onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
              className="form-input-dark"
            />
          </label>
        ))}
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
            Salvar
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
