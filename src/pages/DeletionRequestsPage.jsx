import { useCallback, useDeferredValue, useEffect, useState } from 'react'
import { ArchiveX, Check, Clock3, RotateCcw, User2 } from 'lucide-react'
import { EmptyState } from '../components/common/EmptyState'
import { FiltersBar } from '../components/common/FiltersBar'
import { PageSection } from '../components/common/PageSection'
import { SearchBar } from '../components/common/SearchBar'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import {
  approveInventoryItemDeletion,
  DELETION_REQUEST_STATUSES,
  listInventoryDeletionRequests,
  rejectInventoryItemDeletion,
} from '../services/inventoryDeletionRequests'
import { listClients } from '../services/clients'
import { listUnits } from '../services/units'
import { formatDateTime } from '../utils/date'

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: DELETION_REQUEST_STATUSES.pending, label: 'Pendentes' },
  { value: DELETION_REQUEST_STATUSES.approved, label: 'Aprovadas' },
  { value: DELETION_REQUEST_STATUSES.rejected, label: 'Recusadas' },
]

function statusBadgeClass(status) {
  switch (status) {
    case DELETION_REQUEST_STATUSES.pending:
      return 'border-amber-400/20 bg-amber-400/10 text-amber-200'
    case DELETION_REQUEST_STATUSES.approved:
      return 'border-rose-400/20 bg-rose-400/10 text-rose-200'
    case DELETION_REQUEST_STATUSES.rejected:
      return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
    default:
      return 'border-white/10 bg-white/5 text-slate-300'
  }
}

function parseSnapshot(request) {
  try {
    return JSON.parse(request.itemSnapshotJson || '{}')
  } catch {
    return {}
  }
}

export function DeletionRequestsPage() {
  const { currentUser } = useAuth()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [filters, setFilters] = useState({
    status: DELETION_REQUEST_STATUSES.pending,
    clientId: '',
    unitId: '',
  })
  const [requests, setRequests] = useState([])
  const [clients, setClients] = useState([])
  const [units, setUnits] = useState([])

  const reload = useCallback(() => {
    setClients(listClients())
    setUnits(listUnits())
    setRequests(listInventoryDeletionRequests({ search: deferredSearch, ...filters }))
  }, [deferredSearch, filters])

  useEffect(() => {
    reload()
  }, [reload])

  const pendingCount = listInventoryDeletionRequests({ status: DELETION_REQUEST_STATUSES.pending }).length

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Area administrativa"
        title="Exclusoes de itens"
        description="Fila de itens removidos por operadores, aguardando aprovacao ou restauracao do admin."
      >
        <div className="space-y-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por item, usuario solicitante ou observacao..." />
          <FiltersBar
            filters={[
              {
                name: 'status',
                label: 'Status',
                value: filters.status,
                onChange: (value) => setFilters((current) => ({ ...current, status: value })),
                options: statusOptions,
              },
              {
                name: 'clientId',
                label: 'Cliente',
                value: filters.clientId,
                onChange: (value) => setFilters((current) => ({ ...current, clientId: value })),
                options: clients.map((client) => ({ value: client.id, label: client.name })),
              },
              {
                name: 'unitId',
                label: 'Unidade',
                value: filters.unitId,
                onChange: (value) => setFilters((current) => ({ ...current, unitId: value })),
                options: units.map((unit) => ({ value: unit.id, label: unit.name })),
              },
            ]}
          />
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
            <ArchiveX className="h-4 w-4 text-cyan-300" />
            <span>{pendingCount} pendente(s) de aprovacao</span>
          </div>
        </div>
      </PageSection>

      {requests.length ? (
        <div className="space-y-3">
          {requests.map((request) => {
            const snapshot = parseSnapshot(request)
            const clientName = clients.find((client) => client.id === request.clientId)?.name || '-'
            const unitName = units.find((unit) => unit.id === request.unitId)?.name || '-'

            return (
              <div key={request.id} className="rounded-[24px] border border-white/10 bg-slate-950/60 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-rose-400/10 p-3">
                        <ArchiveX className="h-5 w-5 text-rose-200" />
                      </div>
                      <div>
                        <p className="font-display text-lg font-bold text-white">{request.itemName}</p>
                        <p className="text-sm text-slate-400">{clientName} / {unitName}</p>
                      </div>
                    </div>

                    <div className="grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                      <p>Descricao: {snapshot.description || 'Sem descricao'}</p>
                      <p>Quantidade: {snapshot.quantity || 0} {snapshot.unitMeasure || 'un'}</p>
                      <p>Tipo: {snapshot.type || '-'}</p>
                      <p>Localizacao: {snapshot.internalLocation || '-'}</p>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-slate-300 sm:min-w-[260px]">
                    <div className={`inline-flex items-center justify-center rounded-2xl border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusBadgeClass(request.status)}`}>
                      {request.status}
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <User2 className="h-4 w-4 text-cyan-300" />
                      <span>{request.requestedByName}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <Clock3 className="h-4 w-4 text-cyan-300" />
                      <span>{formatDateTime(request.requestedAt)}</span>
                    </div>

                    {request.status === DELETION_REQUEST_STATUSES.pending ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              approveInventoryItemDeletion(request.id, currentUser)
                              toast.success('Exclusao aprovada definitivamente.')
                              reload()
                            } catch (error) {
                              toast.error(error.message)
                            }
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm font-semibold text-rose-100"
                        >
                          <Check className="h-4 w-4" />
                          Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              rejectInventoryItemDeletion(request.id, currentUser)
                              toast.success('Item restaurado para a unidade original.')
                              reload()
                            } catch (error) {
                              toast.error(error.message)
                            }
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-100"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restaurar
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-400">
                        Revisado por {request.reviewedByName || '-'} em {request.reviewedAt ? formatDateTime(request.reviewedAt) : '-'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma solicitacao encontrada"
          description="Os itens excluidos por operadores aparecerao aqui para aprovacao do administrador."
        />
      )}
    </div>
  )
}
