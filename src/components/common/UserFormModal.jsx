import { useEffect, useState } from 'react'
import { ROLE_LABELS, ROLES } from '../../utils/constants'
import { ModalShell } from './ModalShell'

const initialState = {
  name: '',
  email: '',
  username: '',
  password: '',
  role: ROLES.funcionario,
  active: true,
}

export function UserFormModal({ open, user, onClose, onSubmit }) {
  const [form, setForm] = useState(initialState)

  useEffect(() => {
    setForm(user ? { ...initialState, ...user, password: '' } : initialState)
  }, [user, open])

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={user ? 'Editar usuario' : 'Novo usuario'}
      description="Controle de acesso local para a operacao."
    >
      <form
        className="grid gap-3 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(form)
        }}
      >
        {[
          ['name', 'Nome'],
          ['email', 'Email'],
          ['username', 'Username'],
          ['password', user ? 'Nova senha (opcional)' : 'Senha'],
        ].map(([name, label]) => (
          <label key={name} className="form-label-dark">
            <span className="font-medium">{label}</span>
            <input
              type={name === 'password' ? 'password' : 'text'}
              value={form[name]}
              onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
              className="form-input-dark"
            />
          </label>
        ))}
        <label className="form-label-dark">
          <span className="font-medium">Perfil</span>
          <select
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
            className="form-select-dark"
          >
            {Object.values(ROLES).map((role) => (
              <option key={role} value={role}>{ROLE_LABELS[role]}</option>
            ))}
          </select>
        </label>
        <label className="form-checkbox-dark">
          <input
            type="checkbox"
            checked={Boolean(form.active)}
            onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
          />
          Usuario ativo
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
