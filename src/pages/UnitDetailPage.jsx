import { useCallback, useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { PackagePlus, Repeat, Warehouse } from 'lucide-react'
import { PageSection } from '../components/common/PageSection'
import { InventoryTable } from '../components/inventory/InventoryTable'
import { InventoryItemModal } from '../components/inventory/InventoryItemModal'
import { MovementModal } from '../components/inventory/MovementModal'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { EmptyState } from '../components/common/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { getUnitById, listUnits } from '../services/units'
import { getClientById } from '../services/clients'
import { requestInventoryItemDeletion } from '../services/inventoryDeletionRequests'
import {
  createInventoryItem,
  getInventoryItemById,
  listInventoryItems,
  updateInventoryItem,
} from '../services/inventory'
import { listItemMovementHistory, performMovement } from '../services/movements'
import { canEditInventory } from '../utils/permissions'
import { formatDateTime } from '../utils/date'

export function UnitDetailPage() {
  const { unitId } = useParams()
  const { currentUser } = useAuth()
  const toast = useToast()
  const [unit, setUnit] = useState(null)
  const [client, setClient] = useState(null)
  const [units, setUnits] = useState([])
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [history, setHistory] = useState([])
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [movementModalOpen, setMovementModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [itemToDeactivate, setItemToDeactivate] = useState(null)

  const reload = useCallback(() => {
    const nextUnit = getUnitById(unitId)
    setUnit(nextUnit)
    setClient(nextUnit ? getClientById(nextUnit.clientId) : null)
    const nextUnits = listUnits()
    const nextItems = listInventoryItems({ unitId })
    setUnits(nextUnits)
    setItems(nextItems)
    if (selectedItem) {
      const freshItem = getInventoryItemById(selectedItem.id)
      if (!freshItem || freshItem.pendingDeletion) {
        setSelectedItem(null)
        setHistory([])
      } else {
        setSelectedItem(freshItem)
        setHistory(listItemMovementHistory(selectedItem.id))
      }
    }
  }, [selectedItem, unitId])

  useEffect(() => {
    reload()
  }, [reload])

  if (!unit || !client) {
    return <Navigate to="/clientes" replace />
  }

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Operacao por unidade"
        title={unit.name}
        description={`${client.name} • ${unit.address} • ${unit.city}/${unit.state}`}
        action={canEditInventory(currentUser) ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingItem(null)
                setItemModalOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white"
            >
              <PackagePlus className="h-4 w-4" />
              Novo item
            </button>
            <button
              type="button"
              onClick={() => {
                if (!selectedItem) {
                  toast.info('Selecione um item na tabela para movimentar.')
                  return
                }
                setMovementModalOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              <Repeat className="h-4 w-4" />
              Movimentar item
            </button>
          </div>
        ) : null}
      />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="space-y-4">
          {items.length ? (
            <InventoryTable
              items={items}
              unitMap={Object.fromEntries(units.map((entry) => [entry.id, entry]))}
              clientMap={{ [client.id]: client }}
              onEdit={(item) => {
                setEditingItem(item)
                setItemModalOpen(true)
              }}
              onMove={(item) => {
                setSelectedItem(item)
                setMovementModalOpen(true)
              }}
              onDeactivate={setItemToDeactivate}
              onSelectItem={(item) => {
                setSelectedItem(item)
                setHistory(listItemMovementHistory(item.id))
              }}
            />
          ) : <EmptyState title="Nenhum item cadastrado" description="Cadastre materiais ou ferramentas para esta unidade." />}
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-mist p-3">
              <Warehouse className="h-5 w-5 text-teal-700" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-ink">Historico do item</h3>
              <p className="text-sm text-slate-500">Selecione um item na tabela para ver a trilha operacional.</p>
            </div>
          </div>

          {selectedItem ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-ink">{selectedItem.name}</p>
                <p className="mt-1 text-sm text-slate-500">{selectedItem.quantity} {selectedItem.unitMeasure} • {selectedItem.status}</p>
                <p className="mt-1 text-sm text-slate-500">{selectedItem.internalLocation || 'Sem localizacao interna'}</p>
              </div>
              <div className="space-y-3">
                {history.length ? history.map((movement) => (
                  <div key={movement.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-ink">{movement.movementType}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{formatDateTime(movement.performedAt)}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {movement.previousQuantity} → {movement.newQuantity} • {movement.quantity} movimentado(s)
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{movement.reason || 'Sem motivo informado'}</p>
                  </div>
                )) : <EmptyState title="Sem historico" description="As movimentacoes deste item aparecerao aqui." />}
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState title="Selecione um item" description="Clique em uma linha da tabela para acompanhar o historico detalhado." />
            </div>
          )}
        </section>
      </div>

      <InventoryItemModal
        open={itemModalOpen}
        item={editingItem}
        clients={[client]}
        units={units.filter((entry) => entry.clientId === client.id)}
        defaults={{ clientId: client.id, unitId: unit.id }}
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
        item={selectedItem}
        units={units}
        onClose={() => setMovementModalOpen(false)}
        onSubmit={(form) => {
          try {
            performMovement({ itemId: selectedItem.id, ...form }, currentUser)
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
        description="O item some da operacao agora e fica aguardando aprovacao final do administrador."
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
