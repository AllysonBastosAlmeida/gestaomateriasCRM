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
