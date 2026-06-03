import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { EmptyState } from '../components/common/EmptyState'
import { PageSection } from '../components/common/PageSection'
import { UserFormModal } from '../components/common/UserFormModal'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { createUser, listUsers, updateUser } from '../services/users'
import { ROLE_LABELS } from '../utils/constants'
import { formatDateTime } from '../utils/date'

export function UsersPage() {
  const { currentUser } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  function reload() {
    setUsers(listUsers())
  }

  useEffect(() => {
    reload()
  }, [])

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageSection
        eyebrow="Administracao local"
        title="Usuarios"
        description="Gerencie credenciais locais, perfis e status de acesso dos funcionarios."
        action={(
          <button
            type="button"
            onClick={() => {
              setEditingUser(null)
              setModalOpen(true)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-[12px] font-semibold text-white sm:py-2.5 sm:text-[13px]"
          >
            <Plus className="h-4 w-4" />
            Novo usuario
          </button>
        )}
      />

      {users.length ? (
        <div className="grid gap-2.5 sm:gap-3 xl:grid-cols-2">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                setEditingUser(user)
                setModalOpen(true)
              }}
              className="rounded-[18px] border border-white/10 bg-slate-950/60 p-3 text-left shadow-[0_16px_40px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:border-cyan-300/20 sm:rounded-[24px] sm:p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold text-white sm:text-xl">{user.name}</p>
                  <p className="mt-1 text-[12px] text-slate-400 sm:text-sm">{user.username} / {user.email}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] sm:px-3 sm:text-xs sm:tracking-[0.18em] ${user.active ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300'}`}>
                  {user.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="mt-3 grid gap-1.5 text-[12px] text-slate-400 sm:mt-4 sm:gap-2 sm:text-sm md:grid-cols-2">
                <p>Perfil: {ROLE_LABELS[user.role]}</p>
                <p>Ultimo login: {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Ainda nao acessou'}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhum usuario cadastrado" description="Cadastre administradores e operadores para liberar o acesso local." />
      )}

      <UserFormModal
        open={modalOpen}
        user={editingUser}
        onClose={() => {
          setModalOpen(false)
          setEditingUser(null)
        }}
        onSubmit={(form) => {
          try {
            if (editingUser) {
              updateUser(editingUser.id, form, currentUser)
              toast.success('Usuario atualizado.')
            } else {
              createUser(form, currentUser)
              toast.success('Usuario criado.')
            }
            setModalOpen(false)
            setEditingUser(null)
            reload()
          } catch (error) {
            toast.error(error.message)
          }
        }}
      />
    </div>
  )
}
