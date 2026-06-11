import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Boxes, Filter, Menu, PenSquare, Plus, Search, Trash2, Wrench, X } from 'lucide-react'
import { ClientFormModal } from '../components/clients/ClientFormModal'
import { UnitFormModal } from '../components/clients/UnitFormModal'
import { InventoryItemModal } from '../components/inventory/InventoryItemModal'
import { ItemDetailsModal } from '../components/inventory/ItemDetailsModal'
import { DeletionTrashModal } from '../components/inventory/DeletionTrashModal'
import { QuickTransferModal } from '../components/inventory/QuickTransferModal'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { getClientById, listClients, updateClient } from '../services/clients'
import { DELETION_REQUEST_STATUSES, listInventoryDeletionRequests, rejectDeletionRequest, requestInventoryItemDeletion } from '../services/inventoryDeletionRequests'
import { createInventoryItem, listInventoryItems, updateInventoryItem } from '../services/inventory'
import { listItemMovementHistory, performMovement } from '../services/movements'
import { getStorageProvider } from '../services/storageProvider'
import { createUnit, deleteUnit, listUnits, updateUnit } from '../services/units'
import { getClientBranding } from '../utils/clientBranding'
import { canEditInventory, canManageClients, canViewMovementLog } from '../utils/permissions'
import { ITEM_TYPES, ROUTES } from '../utils/constants'

const typeOptions = [
  { value: 'todos', label: 'Todos os tipos' },
  ...ITEM_TYPES.map((type) => ({
    value: type.value,
    label: type.value === 'material' ? 'Materiais' : `${type.label}s`,
  })),
]

const statusOptions = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'disponivel', label: 'Disponivel' },
  { value: 'em_uso', label: 'Em uso' },
  { value: 'manutencao', label: 'Manutencao' },
  { value: 'baixado', label: 'Baixado' },
]

export function ClientDetailPage() {
  const HIGHLIGHT_WINDOW_MS = 3 * 60 * 1000
  const { clientId } = useParams()
  const { currentUser } = useAuth()
  const toast = useToast()
  const storageProvider = useMemo(() => getStorageProvider(), [])
  const [client, setClient] = useState(null)
  const [allClients, setAllClients] = useState([])
  const [isReady, setIsReady] = useState(false)
  const [units, setUnits] = useState([])
  const [allUnits, setAllUnits] = useState([])
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ferramenta')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [unitModalOpen, setUnitModalOpen] = useState(false)
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [itemModalDefaults, setItemModalDefaults] = useState({ clientId: '', unitId: '' })
  const [itemDetailsOpen, setItemDetailsOpen] = useState(false)
  const [trashModalOpen, setTrashModalOpen] = useState(false)
  const [quickTransferOpen, setQuickTransferOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [draggedItem, setDraggedItem] = useState(null)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [unitToDelete, setUnitToDelete] = useState(null)
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const [highlightTick, setHighlightTick] = useState(0)

  const reload = useCallback(() => {
    setClient(getClientById(clientId))
    setAllClients(listClients())
    setAllUnits(listUnits())
    setUnits(listUnits({ clientId }))
    setItems(listInventoryItems({ clientId }))
    setIsReady(true)
  }, [clientId])

  useEffect(() => {
    setIsReady(false)
    reload()
  }, [reload])

  useEffect(() => {
    if (selectedItemId && !items.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(null)
      setItemDetailsOpen(false)
    }
  }, [items, selectedItemId])

  useEffect(() => {
    setHighlightTick(Date.now())
    const timer = window.setInterval(() => {
      setHighlightTick(Date.now())
    }, 30000)

    return () => window.clearInterval(timer)
  }, [])

  const searchableTerm = search.trim().toLowerCase()
  const filteredItems = items.filter((item) => {
    if (typeFilter !== 'todos' && item.type !== typeFilter) return false
    if (statusFilter !== 'todos' && item.status !== statusFilter) return false
    if (!searchableTerm) return true

    return [
      item.name,
      item.description,
      item.sku,
      item.serialNumber,
    ].join(' ').toLowerCase().includes(searchableTerm)
  })

  const groupedByUnit = units.map((unit) => ({
    ...unit,
    rows: filteredItems
      .filter((item) => item.unitId === unit.id)
      .map((item) => ({ ...item, unitName: unit.name }))
      .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR', { sensitivity: 'base' })),
  }))

  const totalItems = filteredItems.length
  const lowStockCount = filteredItems.filter((item) => Number(item.quantity) <= Number(item.minQuantity || 0)).length
  const maintenanceCount = filteredItems.filter((item) => item.status === 'manutencao').length

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) || null,
    [items, selectedItemId],
  )

  const selectedItemUnit = selectedItem
    ? units.find((unit) => unit.id === selectedItem.unitId) || null
    : null

  const selectedItemHistory = selectedItem ? listItemMovementHistory(selectedItem.id).slice(0, 6) : []
  const myPendingDeletionRequests = useMemo(
    () => listInventoryDeletionRequests({
      status: DELETION_REQUEST_STATUSES.pending,
      clientId,
      requestedBy: currentUser?.id || '',
    }),
    [clientId, currentUser?.id],
  )

  const flushWorkspaceSync = useCallback(async () => {
    if (typeof storageProvider.pushRemote !== 'function') {
      return
    }

    await storageProvider.pushRemote(storageProvider.readDb())
  }, [storageProvider])

  if (!isReady) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="rounded-[24px] border border-white/10 bg-slate-950/60 px-6 py-4 text-sm text-slate-300">
          Carregando workspace do cliente...
        </div>
      </div>
    )
  }

  if (!client) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  const branding = getClientBranding(client)
  const metrics = [
    ['Itens', totalItems, Boxes],
    ['Baixo', lowStockCount, Filter],
    ['Manut.', maintenanceCount, Wrench],
  ]
  const hasManageActions = canManageClients(currentUser)
  const hasEditActions = canEditInventory(currentUser)

  const closeMobilePanel = () => setMobilePanelOpen(false)

  const openNewItemModal = (defaultUnitId = '') => {
    setEditingItem(null)
    setItemModalDefaults({
      clientId: client.id,
      unitId: defaultUnitId || units[0]?.id || '',
    })
    setItemModalOpen(true)
  }

  return (
    <div className="space-y-2">
      {mobilePanelOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden" onClick={closeMobilePanel} />
      ) : null}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-[86vw] max-w-[340px] border-r border-cyan-400/10 bg-[linear-gradient(180deg,rgba(6,11,27,0.98)_0%,rgba(9,18,39,0.99)_52%,rgba(7,13,30,1)_100%)] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)] transition-transform duration-200 lg:hidden',
          mobilePanelOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Workspace do cliente</p>
            <h2 className="mt-1 truncate font-display text-lg font-extrabold text-white">{client.name}</h2>
            <p className="mt-1 text-[11px] leading-4 text-slate-400">
              Acoes, filtros e resumo operacional.
            </p>
          </div>
          <button
            type="button"
            onClick={closeMobilePanel}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200"
            aria-label="Fechar menu lateral"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 space-y-3 overflow-y-auto pb-6">
          <div className="flex flex-wrap gap-2">
            {hasManageActions ? (
              <>
                {canViewMovementLog(currentUser) ? (
                  <Link
                    to={ROUTES.movements}
                    onClick={closeMobilePanel}
                    className="rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] font-semibold text-slate-200"
                  >
                    Ver log
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setClientModalOpen(true)
                    closeMobilePanel()
                  }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] font-semibold text-slate-200"
                >
                  Editar cliente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingUnit(null)
                    setUnitModalOpen(true)
                    closeMobilePanel()
                  }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] font-semibold text-slate-200"
                >
                  Nova unidade
                </button>
              </>
            ) : null}
            {hasEditActions ? (
              <button
                type="button"
                onClick={() => {
                  setTrashModalOpen(true)
                  closeMobilePanel()
                }}
                className="rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] font-semibold text-slate-200"
              >
                Lixeira
              </button>
            ) : null}
            {hasEditActions ? (
                <button
                  type="button"
                  onClick={() => {
                    openNewItemModal()
                    closeMobilePanel()
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-2.5 py-1.5 text-[12px] font-semibold text-slate-950"
              >
                <Plus className="h-3.5 w-3.5" />
                Novo item
              </button>
            ) : null}
          </div>

          <div className="space-y-2 rounded-[18px] border border-white/10 bg-white/5 p-2">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por item, descricao, SKU ou serial"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/55 py-1.5 pl-9 pr-3 text-[12px] text-white outline-none transition focus:border-cyan-400"
              />
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/55 px-2.5 text-slate-400">
              <Filter className="h-3.5 w-3.5 text-cyan-300" />
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="workspace-inline-select"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/55 px-2.5 text-slate-400">
              <Wrench className="h-3.5 w-3.5 text-cyan-300" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="workspace-inline-select"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            {metrics.map(([label, value, Icon]) => (
              <div key={label} className="rounded-[16px] border border-white/10 bg-white/5 px-2.5 py-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <Icon className="h-3.5 w-3.5 text-cyan-300" />
                  <span className="text-[10px] uppercase tracking-[0.18em]">{label}</span>
                </div>
                <p className="mt-0.5 font-display text-base font-extrabold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="rounded-[20px] border border-white/10 bg-slate-950/60 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-2.5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-2 lg:items-start">
              <Link
                to={ROUTES.dashboard}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setMobilePanelOpen(true)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 lg:hidden"
                aria-label="Abrir menu lateral do cliente"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {branding.logoDataUrl ? (
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[16px] border border-white/10 bg-white/5 p-1">
                  <img src={branding.logoDataUrl} alt={`Logo ${client.name}`} className="h-full w-full rounded-[inherit] object-contain" />
                </div>
              ) : (
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br ${branding.gradient} text-sm font-extrabold text-white`}>
                  {branding.logoText}
                </div>
              )}
              <div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-2.5 text-slate-400">
                  <Filter className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className="workspace-inline-select min-w-0 flex-1"
                    aria-label="Filtrar itens por tipo"
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">Workspace do cliente</p>
              <h1 className="mt-1 font-display text-[1.1rem] font-extrabold leading-tight text-white sm:text-[1.35rem]">{client.name}</h1>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-400">
                Lista operacional por unidade. No desktop, arraste. No celular, toque no item e use mover.
              </p>
            </div>
          </div>
          <div className="hidden flex-wrap gap-2 lg:flex">
            {hasManageActions ? (
              <>
                {canViewMovementLog(currentUser) ? (
                  <Link
                    to={ROUTES.movements}
                    className="rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] font-semibold text-slate-200"
                  >
                    Ver log
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => setClientModalOpen(true)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] font-semibold text-slate-200"
                >
                  Editar nome e dados do cliente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingUnit(null)
                    setUnitModalOpen(true)
                  }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] font-semibold text-slate-200"
                >
                  Nova unidade
                </button>
              </>
            ) : null}
            {hasEditActions ? (
              <button
                type="button"
                onClick={() => setTrashModalOpen(true)}
                className="rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] font-semibold text-slate-200"
              >
                <span className="inline-flex items-center gap-2">
                  <Trash2 className="h-3.5 w-3.5" />
                  Lixeira
                </span>
              </button>
            ) : null}
            {hasEditActions ? (
              <button
                type="button"
                onClick={() => {
                  openNewItemModal()
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-2.5 py-1.5 text-[12px] font-semibold text-slate-950"
              >
                <Plus className="h-3.5 w-3.5" />
                Novo item
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-2.5 hidden gap-2 lg:grid lg:grid-cols-[1.45fr_0.55fr]">
          <div className="rounded-[18px] border border-white/10 bg-white/5 p-2">
            <div className="flex flex-col gap-1.5 md:flex-row">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por item, descricao, SKU ou serial"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/55 py-1.5 pl-9 pr-3 text-[12px] text-white outline-none transition focus:border-cyan-400"
                />
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/55 px-2.5 text-slate-400">
                <Filter className="h-3.5 w-3.5 text-cyan-300" />
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="workspace-inline-select"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/55 px-2.5 text-slate-400">
                <Wrench className="h-3.5 w-3.5 text-cyan-300" />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="workspace-inline-select"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {metrics.map(([label, value, Icon]) => (
              <div key={label} className="rounded-[16px] border border-white/10 bg-white/5 px-2.5 py-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <Icon className="h-3.5 w-3.5 text-cyan-300" />
                  <span className="text-[10px] uppercase tracking-[0.18em]">{label}</span>
                </div>
                <p className="mt-0.5 font-display text-base font-extrabold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-2">
        <div className="grid min-h-[52vh] gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {groupedByUnit.map((unit) => (
            <div
              key={unit.id}
              className="flex min-h-[150px] flex-col rounded-[18px] border border-white/10 bg-slate-950/55 p-2 shadow-[0_14px_30px_rgba(0,0,0,0.16)]"
              onDragOver={(event) => {
                if (!canEditInventory(currentUser)) return
                event.preventDefault()
              }}
              onDrop={(event) => {
                if (!canEditInventory(currentUser)) return
                event.preventDefault()
                const dragged = JSON.parse(event.dataTransfer.getData('application/json'))
                if (!dragged || dragged.unitId === unit.id) return
                try {
                  performMovement({
                    itemId: dragged.id,
                    movementType: 'transferencia',
                    destinationUnitId: unit.id,
                    quantity: dragged.quantity,
                    reason: 'Transferencia por arrastar e soltar',
                    notes: '',
                  }, currentUser)
                  toast.success('Item remanejado com sucesso.')
                  reload()
                } catch (error) {
                  toast.error(error.message)
                }
              }}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div>
                  <p className="font-display text-[12px] font-bold text-white">{unit.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{unit.code}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    {unit.rows.length} itens
                  </div>
                  {hasEditActions ? (
                    <button
                      type="button"
                      onClick={() => openNewItemModal(unit.id)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 transition hover:border-cyan-300/35 hover:text-white"
                      aria-label={`Adicionar item em ${unit.name}`}
                      title="Adicionar item"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  {canManageClients(currentUser) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUnit(unit)
                        setUnitModalOpen(true)
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/20 hover:text-white"
                      aria-label={`Editar ${unit.name}`}
                    >
                      <PenSquare className="h-3 w-3" />
                    </button>
                  ) : null}
                </div>
              </div>

                <div className="flex-1 space-y-1">
                  {unit.rows.length ? unit.rows.map((item) => (
                    (() => {
                      const highlightAge = item.activityHighlightAt
                        ? highlightTick - new Date(item.activityHighlightAt).getTime()
                        : Number.POSITIVE_INFINITY
                      const isRecentlyHighlighted = Number.isFinite(highlightAge) && highlightAge >= 0 && highlightAge <= HIGHLIGHT_WINDOW_MS
                      const highlightClass = item.activityHighlightType === 'created'
                        ? 'border-emerald-300/35 bg-emerald-400/10'
                        : 'border-amber-300/35 bg-amber-300/10'

                      return (
                    <button
                      key={item.id}
                    type="button"
                    draggable={canEditInventory(currentUser)}
                    onClick={() => {
                      setSelectedItemId(item.id)
                      setItemDetailsOpen(true)
                    }}
                    onDragStart={(event) => {
                      setDraggedItem(item.id)
                      event.dataTransfer.setData('application/json', JSON.stringify(item))
                    }}
                    onDragEnd={() => setDraggedItem(null)}
                    className={[
                      'flex w-full cursor-pointer items-center gap-2 rounded-[11px] border px-2.5 py-1 text-left transition md:cursor-grab',
                      selectedItemId === item.id
                        ? 'border-cyan-300/40 bg-cyan-400/10'
                        : isRecentlyHighlighted
                          ? highlightClass
                          : 'border-white/10 bg-white/5 hover:border-white/20',
                      draggedItem === item.id ? 'ring-1 ring-cyan-300/30' : '',
                    ].join(' ')}
                    >
                      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                        <p className="min-w-0 flex-1 truncate text-[11px] font-semibold leading-4 text-white">{item.name}</p>
                        <p className="shrink-0 text-[9px] text-slate-400">
                          {item.quantity} {item.unitMeasure}
                        </p>
                      </div>
                    </button>
                      )
                    })()
                  )) : (
                  <div className="rounded-[14px] border border-dashed border-white/10 bg-white/[0.03] px-3 py-4 text-center text-[11px] text-slate-500">
                    Solte itens aqui para transferir para esta unidade.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <ClientFormModal
        open={clientModalOpen}
        client={client}
        onClose={() => setClientModalOpen(false)}
        onSubmit={async (form) => {
          try {
            await updateClient(client.id, form, currentUser)
            toast.success('Cliente atualizado.')
            setClientModalOpen(false)
            reload()
          } catch (error) {
            toast.error(error.message)
          }
        }}
      />

      <UnitFormModal
        open={unitModalOpen}
        unit={editingUnit}
        clientId={client.id}
        onDelete={editingUnit ? () => {
          setUnitModalOpen(false)
          setUnitToDelete(editingUnit)
        } : undefined}
        onClose={() => {
          setUnitModalOpen(false)
          setEditingUnit(null)
        }}
        onSubmit={async (form) => {
          try {
            if (editingUnit) {
              updateUnit(editingUnit.id, form, currentUser)
              toast.success('Unidade atualizada.')
            } else {
              createUnit({ ...form, clientId: client.id }, currentUser)
              toast.success('Unidade criada.')
            }
            await flushWorkspaceSync()
            setUnitModalOpen(false)
            setEditingUnit(null)
            reload()
          } catch (error) {
            toast.error(error.message)
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(unitToDelete)}
        title="Enviar unidade para exclusao?"
        description="Deseja enviar esta unidade para exclusao? Ela some agora da operacao e vai para a fila de aprovacao do admin com todos os itens vinculados."
        confirmLabel="Enviar para exclusao"
        onClose={() => {
          setUnitToDelete(null)
          setEditingUnit(null)
        }}
        onConfirm={async () => {
          try {
            const summary = deleteUnit(unitToDelete.id, currentUser)
            await flushWorkspaceSync()
            toast.success(`Unidade enviada para aprovacao. ${summary.removedItemsCount} item(ns) ocultado(s).`)
            setUnitToDelete(null)
            setEditingUnit(null)
            reload()
          } catch (error) {
            toast.error(error.message)
          }
        }}
      />

      <InventoryItemModal
        open={itemModalOpen}
        item={editingItem}
        clients={[client]}
        units={units}
        defaults={itemModalDefaults}
        onClose={() => {
          setItemModalOpen(false)
          setEditingItem(null)
        }}
        onSubmit={async (form) => {
          try {
            if (editingItem) {
              updateInventoryItem(editingItem.id, form, currentUser)
              toast.success('Item atualizado.')
            } else {
              createInventoryItem(form, currentUser)
              toast.success('Item criado.')
            }
            await flushWorkspaceSync()
            setItemModalOpen(false)
            setEditingItem(null)
            reload()
          } catch (error) {
            toast.error(error.message)
          }
        }}
      />

      <ItemDetailsModal
        open={itemDetailsOpen}
        item={selectedItem}
        unitName={selectedItemUnit?.name}
        history={selectedItemHistory}
        onClose={() => setItemDetailsOpen(false)}
        onEdit={() => {
          setItemDetailsOpen(false)
          setEditingItem(selectedItem)
          setItemModalOpen(true)
        }}
        onMove={canEditInventory(currentUser) ? () => {
          setItemDetailsOpen(false)
          setQuickTransferOpen(true)
        } : undefined}
        onDelete={canEditInventory(currentUser) ? () => {
          setItemDetailsOpen(false)
          setItemToDelete(selectedItem)
        } : undefined}
      />

      <QuickTransferModal
        open={quickTransferOpen}
        item={selectedItem}
        units={allUnits}
        clients={allClients}
        onClose={() => setQuickTransferOpen(false)}
        onSubmit={async (form) => {
          try {
            performMovement({ itemId: selectedItem.id, ...form }, currentUser)
            await flushWorkspaceSync()
            toast.success('Item remanejado com sucesso.')
            setQuickTransferOpen(false)
            reload()
          } catch (error) {
            toast.error(error.message)
          }
        }}
      />

      <DeletionTrashModal
        open={trashModalOpen}
        requests={myPendingDeletionRequests}
        onClose={() => setTrashModalOpen(false)}
        onRestore={async (request) => {
          try {
            rejectDeletionRequest(request.id, currentUser)
            await flushWorkspaceSync()
            toast.success(request.requestType === 'unit' ? 'Unidade restaurada.' : 'Item restaurado.')
            reload()
          } catch (error) {
            toast.error(error.message)
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(itemToDelete)}
        title="Enviar item para exclusao?"
        description="O item some da lista operacional agora e fica aguardando aprovacao final do administrador."
        confirmLabel="Excluir item"
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          try {
            requestInventoryItemDeletion(itemToDelete.id, currentUser)
            await flushWorkspaceSync()
            toast.success('Item enviado para a fila de exclusao.')
            setItemToDelete(null)
            setSelectedItemId(null)
            reload()
          } catch (error) {
            toast.error(error.message)
          }
        }}
      />
    </div>
  )
}
