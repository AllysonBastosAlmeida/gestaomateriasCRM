import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArchiveX, LogOut, ShieldCheck } from 'lucide-react'
import { ClientCard } from '../components/clients/ClientCard'
import { ClientFormModal } from '../components/clients/ClientFormModal'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { updateClient } from '../services/clients'
import { listClients } from '../services/clients'
import { DELETION_REQUEST_STATUSES, listInventoryDeletionRequests } from '../services/inventoryDeletionRequests'
import { listUnits } from '../services/units'
import { listInventoryItems } from '../services/inventory'
import { canManageClients, canViewMovementLog } from '../utils/permissions'
import { ROUTES } from '../utils/constants'

export function DashboardPage() {
  const { currentUser, logout } = useAuth()
  const toast = useToast()
  const clients = listClients()
  const units = listUnits()
  const items = listInventoryItems()
  const pendingDeletionCount = listInventoryDeletionRequests({ status: DELETION_REQUEST_STATUSES.pending }).length
  const [editingClient, setEditingClient] = useState(null)

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-4 flex flex-col gap-3 pt-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-cyan-200">
              <ShieldCheck className="h-4 w-4" />
              {currentUser.role === 'admin' ? 'Administrador' : 'Usuario operacional'}
            </div>
            <p className="mt-2 text-sm text-slate-400">{currentUser.name}</p>
          </div>
          <div className="flex items-center justify-center gap-2 self-center sm:self-auto">
            {currentUser.role === 'admin' ? (
              <Link
                to={ROUTES.deletionRequests}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-300/30 hover:text-white"
              >
                <ArchiveX className="h-4 w-4" />
                {pendingDeletionCount} {pendingDeletionCount === 1 ? 'exclusao' : 'exclusoes'}
              </Link>
            ) : null}
            {canViewMovementLog(currentUser) ? (
              <Link
                to={ROUTES.movements}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:text-white"
              >
                Ver log
              </Link>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 justify-items-center gap-4 pt-6 sm:grid-cols-3 lg:grid-cols-4">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              unitsCount={units.filter((unit) => unit.clientId === client.id).length}
              itemsCount={items.filter((item) => item.clientId === client.id).length}
              variant="selector"
              onEdit={canManageClients(currentUser) ? () => setEditingClient(client) : undefined}
            />
          ))}
        </div>
      </div>

      <ClientFormModal
        open={Boolean(editingClient)}
        client={editingClient}
        onClose={() => setEditingClient(null)}
        onSubmit={async (form) => {
          try {
            await updateClient(editingClient.id, form, currentUser)
            toast.success('Cliente atualizado.')
            setEditingClient(null)
          } catch (error) {
            toast.error(error.message)
          }
        }}
      />
    </div>
  )
}
