import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArchiveX, Clock3, LogOut, ShieldCheck, Warehouse } from 'lucide-react'
import { ClientCard } from '../components/clients/ClientCard'
import { ClientFormModal } from '../components/clients/ClientFormModal'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { updateClient } from '../services/clients'
import { listClients } from '../services/clients'
import { DELETION_REQUEST_STATUSES, listInventoryDeletionRequests } from '../services/inventoryDeletionRequests'
import { listUnits } from '../services/units'
import { listInventoryItems } from '../services/inventory'
import { getDashboardSnapshot } from '../services/dashboard'
import { canManageClients, canViewMovementLog } from '../utils/permissions'
import { ROUTES } from '../utils/constants'
import { formatDate } from '../utils/date'

export function DashboardPage() {
  const { currentUser, logout } = useAuth()
  const toast = useToast()
  const clients = listClients()
  const units = listUnits()
  const items = listInventoryItems()
  const pendingDeletionCount = listInventoryDeletionRequests({ status: DELETION_REQUEST_STATUSES.pending }).length
  const dashboard = getDashboardSnapshot()
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

        <section className="mb-5 rounded-[24px] border border-white/10 bg-slate-950/60 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Monitoramento</p>
              <h2 className="mt-1 font-display text-lg font-extrabold text-white">Alertas operacionais</h2>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[18px] border border-amber-400/15 bg-amber-400/10 p-3">
              <div className="flex items-center gap-2 text-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-300" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Baixo estoque</span>
              </div>
              <p className="mt-2 font-display text-2xl font-extrabold text-white">{dashboard.totals.lowStock}</p>
              <p className="mt-1 text-[12px] text-amber-100/80">Itens abaixo do minimo.</p>
            </div>

            <div className="rounded-[18px] border border-cyan-400/15 bg-cyan-400/10 p-3">
              <div className="flex items-center gap-2 text-cyan-100">
                <ArchiveX className="h-4 w-4 text-cyan-300" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Exclusoes</span>
              </div>
              <p className="mt-2 font-display text-2xl font-extrabold text-white">{dashboard.totals.pendingDeletionRequests}</p>
              <p className="mt-1 text-[12px] text-cyan-100/80">Pendentes de aprovacao.</p>
            </div>

            <div className="rounded-[18px] border border-fuchsia-400/15 bg-fuchsia-400/10 p-3">
              <div className="flex items-center gap-2 text-fuchsia-100">
                <Warehouse className="h-4 w-4 text-fuchsia-300" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Unidades vazias</span>
              </div>
              <p className="mt-2 font-display text-2xl font-extrabold text-white">{dashboard.totals.emptyUnits}</p>
              <p className="mt-1 text-[12px] text-fuchsia-100/80">Sem itens cadastrados.</p>
            </div>

            <div className="rounded-[18px] border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 text-slate-200">
                <Clock3 className="h-4 w-4 text-slate-300" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Sem movimento</span>
              </div>
              <p className="mt-2 font-display text-2xl font-extrabold text-white">{dashboard.totals.staleItems}</p>
              <p className="mt-1 text-[12px] text-slate-400">Ha {dashboard.alerts.staleMovementDays} dias ou mais.</p>
            </div>
          </div>

          <div className="mt-3 grid gap-2 xl:grid-cols-3">
            <div className="rounded-[18px] border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">Itens criticos</h3>
                <Link to={ROUTES.inventory} className="text-[11px] font-semibold text-cyan-300">
                  Ver estoque
                </Link>
              </div>
              <div className="mt-3 space-y-2">
                {dashboard.alerts.lowStockItems.length ? dashboard.alerts.lowStockItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/55 px-3 py-2">
                    <p className="truncate text-[12px] font-semibold text-white">{item.name}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{item.clientName} / {item.unitName}</p>
                    <p className="mt-1 text-[11px] text-amber-200">{item.quantity} {item.unitMeasure} em estoque</p>
                  </div>
                )) : (
                  <p className="text-[12px] text-slate-400">Nenhum item abaixo do minimo agora.</p>
                )}
              </div>
            </div>

            <div className="rounded-[18px] border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">Sem movimentacao</h3>
                <Link to={ROUTES.inventory} className="text-[11px] font-semibold text-cyan-300">
                  Ver itens
                </Link>
              </div>
              <div className="mt-3 space-y-2">
                {dashboard.alerts.staleItems.length ? dashboard.alerts.staleItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/55 px-3 py-2">
                    <p className="truncate text-[12px] font-semibold text-white">{item.name}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{item.clientName} / {item.unitName}</p>
                    <p className="mt-1 text-[11px] text-slate-300">Ultimo registro: {formatDate(item.lastMovementAt)}</p>
                  </div>
                )) : (
                  <p className="text-[12px] text-slate-400">Nenhum item parado por muito tempo.</p>
                )}
              </div>
            </div>

            <div className="rounded-[18px] border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">Estrutura</h3>
                {currentUser.role === 'admin' ? (
                  <Link to={ROUTES.deletionRequests} className="text-[11px] font-semibold text-cyan-300">
                    Ver exclusoes
                  </Link>
                ) : null}
              </div>
              <div className="mt-3 space-y-2">
                {dashboard.alerts.emptyUnits.map((unit) => (
                  <div key={unit.id} className="rounded-2xl border border-white/10 bg-slate-950/55 px-3 py-2">
                    <p className="truncate text-[12px] font-semibold text-white">{unit.name}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{unit.clientName}</p>
                    <p className="mt-1 text-[11px] text-fuchsia-200">Unidade sem itens.</p>
                  </div>
                ))}
                {!dashboard.alerts.emptyUnits.length ? (
                  <p className="text-[12px] text-slate-400">Nenhuma unidade vazia.</p>
                ) : null}
                {currentUser.role === 'admin' && dashboard.alerts.pendingDeletionRequests.length ? (
                  <div className="rounded-2xl border border-amber-400/15 bg-amber-400/10 px-3 py-2">
                    <p className="text-[12px] font-semibold text-white">
                      {dashboard.alerts.pendingDeletionRequests.length} exclusao(oes) aguardando aprovacao.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

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
