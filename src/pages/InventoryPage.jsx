import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { PackagePlus } from 'lucide-react'
import { PageSection } from '../components/common/PageSection'
import { SearchBar } from '../components/common/SearchBar'
import { FiltersBar } from '../components/common/FiltersBar'
import { InventoryTable } from '../components/inventory/InventoryTable'
import { InventoryItemModal } from '../components/inventory/InventoryItemModal'
import { MovementModal } from '../components/inventory/MovementModal'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { EmptyState } from '../components/common/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { listClients } from '../services/clients'
import { requestInventoryItemDeletion } from '../services/inventoryDeletionRequests'
import { listUnits } from '../services/units'
import {
  createInventoryItem,
  listInventoryItems,
  updateInventoryItem,
} from '../services/inventory'
import { performMovement } from '../services/movements'
import { ITEM_STATUSES, ITEM_TYPES } from '../utils/constants'
import { canEditInventory } from '../utils/permissions'

export function InventoryPage() {
  const { currentUser } = useAuth()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [filters, setFilters] = useState({
    clientId: '',
    unitId: '',
    type: '',
    category: '',
    status: '',
  })
  const [clients, setClients] = useState([])
  const [units, setUnits] = useState([])
  const [items, setItems] = useState([])
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [movementModalOpen, setMovementModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [activeItem, setActiveItem] = useState(null)
  const [itemToDeactivate, setItemToDeactivate] = useState(null)

  const reload = useCallback(() => {
    const nextClients = listClients()
    const nextUnits = listUnits()
    const nextItems = listInventoryItems({ search: deferredSearch, ...filters })
    setClients(nextClients)
    setUnits(nextUnits)
    setItems(nextItems)
  }, [deferredSearch, filters])

  useEffect(() => {
    reload()
  }, [reload])

  const categories = useMemo(() => {
    const available = new Set(listInventoryItems().map((item) => item.category).filter(Boolean))
    return [...available].map((category) => ({ value: category, label: category }))
  }, [])

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Estoque global"
        title="Estoque"
        description="Controle geral de materiais e ferramentas com busca, filtros e acoes operacionais."
        action={canEditInventory(currentUser) ? (
          <button
            type="button"
            onClick={() => {
              setEditingItem(null)
              setItemModalOpen(true)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-2.5 text-[13px] font-semibold text-white"
          >
            <PackagePlus className="h-4 w-4" />
            Novo item
          </button>
        ) : null}
      >
        <div className="space-y-4">
          <div className="max-w-xl">
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nome, categoria, SKU, serial ou localizacao..." />
          </div>
          <FiltersBar
            filters={[
              {
                name: 'clientId',
                label: 'Cliente',
                value: filters.clientId,
                onChange: (value) => setFilters((current) => ({ ...current, clientId: value, unitId: '' })),
                options: clients.map((client) => ({ value: client.id, label: client.name })),
              },
              {
                name: 'unitId',
                label: 'Unidade',
                value: filters.unitId,
                onChange: (value) => setFilters((current) => ({ ...current, unitId: value })),
                options: units
                  .filter((unit) => !filters.clientId || unit.clientId === filters.clientId)
                  .map((unit) => ({ value: unit.id, label: unit.name })),
              },
              {
                name: 'type',
                label: 'Tipo',
                value: filters.type,
                onChange: (value) => setFilters((current) => ({ ...current, type: value })),
                options: ITEM_TYPES,
              },
              {
                name: 'category',
                label: 'Categoria',
                value: filters.category,
                onChange: (value) => setFilters((current) => ({ ...current, category: value })),
                options: categories,
              },
              {
                name: 'status',
                label: 'Status',
                value: filters.status,
                onChange: (value) => setFilters((current) => ({ ...current, status: value })),
                options: ITEM_STATUSES,
              },
            ]}
          />
        </div>
      </PageSection>

      {items.length ? (
        <InventoryTable
          items={items}
          unitMap={Object.fromEntries(units.map((unit) => [unit.id, unit]))}
          clientMap={Object.fromEntries(clients.map((client) => [client.id, client]))}
          onEdit={(item) => {
            setEditingItem(item)
            setItemModalOpen(true)
          }}
          onMove={(item) => {
            setActiveItem(item)
            setMovementModalOpen(true)
          }}
          onDeactivate={setItemToDeactivate}
          onSelectItem={setActiveItem}
        />
      ) : (
        <EmptyState title="Nenhum item encontrado" description="Ajuste os filtros ou cadastre um novo item para alimentar o estoque." />
      )}

      <InventoryItemModal
        open={itemModalOpen}
        item={editingItem}
        clients={clients}
        units={units}
        defaults={{ clientId: filters.clientId, unitId: filters.unitId }}
        onClose={() => {
          setItemModalOpen(false)
          setEditingItem(null)
        }}
        onSubmit={(form) => {
          try {
            if (editingItem) {
              updateInventoryItem(editingItem.id, form, currentUser)
              toast.success('Item atualizado.')
            } else {
              createInventoryItem(form, currentUser)
              toast.success('Item criado.')
            }
            setItemModalOpen(false)
            setEditingItem(null)
            reload()
          } catch (error) {
            toast.error(error.message)
          }
        }}
      />

      <MovementModal
        open={movementModalOpen}
        item={activeItem}
        units={units}
        onClose={() => setMovementModalOpen(false)}
        onSubmit={(form) => {
          try {
            performMovement({ itemId: activeItem.id, ...form }, currentUser)
            toast.success('Movimentacao registrada.')
            setMovementModalOpen(false)
            reload()
          } catch (error) {
            toast.error(error.message)
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(itemToDeactivate)}
        title="Enviar item para exclusao?"
        description="O item some da operacao agora e entra na fila de aprovacao do administrador."
        confirmLabel="Excluir item"
        onClose={() => setItemToDeactivate(null)}
        onConfirm={() => {
          try {
            requestInventoryItemDeletion(itemToDeactivate.id, currentUser)
            toast.success('Item enviado para a fila de exclusao.')
            setItemToDeactivate(null)
            reload()
          } catch (error) {
            toast.error(error.message)
          }
        }}
      />
    </div>
  )
}
