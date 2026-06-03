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
