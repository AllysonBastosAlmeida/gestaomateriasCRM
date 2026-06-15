import { listClients } from './clients'
import { listUnits } from './units'
import { listInventoryItems } from './inventory'
import { listMovements } from './movements'
import { listAuditLogs } from './audit'
import { DELETION_REQUEST_STATUSES, listInventoryDeletionRequests } from './inventoryDeletionRequests'

const STALE_MOVEMENT_DAYS = 30

export function getDashboardSnapshot() {
  const clients = listClients()
  const units = listUnits()
  const items = listInventoryItems()
  const movements = listMovements()
  const auditLogs = listAuditLogs()
  const deletionRequests = listInventoryDeletionRequests({ status: DELETION_REQUEST_STATUSES.pending })
  const unitNameById = new Map(units.map((unit) => [unit.id, unit.name]))
  const clientNameById = new Map(clients.map((client) => [client.id, client.name]))

  const lowStockItems = items.filter((item) => Number(item.quantity) <= Number(item.minQuantity || 0))
  const maintenanceTools = items.filter((item) => item.type === 'ferramenta' && item.status === 'manutencao')
  const emptyUnits = units.filter((unit) => !items.some((item) => item.unitId === unit.id))
  const lastMovementAtByItemId = new Map()

  for (const movement of movements) {
    const currentTimestamp = String(lastMovementAtByItemId.get(movement.itemId) || '')
    const movementTimestamp = String(movement.performedAt || '')
    if (movementTimestamp > currentTimestamp) {
      lastMovementAtByItemId.set(movement.itemId, movementTimestamp)
    }
  }

  const staleThreshold = Date.now() - (STALE_MOVEMENT_DAYS * 24 * 60 * 60 * 1000)
  const staleItems = items.filter((item) => {
    const referenceTimestamp = String(
      lastMovementAtByItemId.get(item.id)
      || item.updatedAt
      || item.createdAt
      || '',
    )

    if (!referenceTimestamp) {
      return false
    }

    const parsedTimestamp = new Date(referenceTimestamp).getTime()
    return Number.isFinite(parsedTimestamp) && parsedTimestamp <= staleThreshold
  })

  const itemsByClient = clients.map((client) => ({
    label: client.name,
    value: items.filter((item) => item.clientId === client.id).length,
  }))

  const itemsByUnit = units.map((unit) => ({
    label: unit.name,
    value: items.filter((item) => item.unitId === unit.id).length,
  }))

  return {
    totals: {
      clients: clients.length,
      units: units.length,
      items: items.length,
      lowStock: lowStockItems.length,
      maintenanceTools: maintenanceTools.length,
      pendingDeletionRequests: deletionRequests.length,
      emptyUnits: emptyUnits.length,
      staleItems: staleItems.length,
    },
    lowStockItems,
    maintenanceTools,
    recentMovements: movements.slice(0, 6),
    recentAuditLogs: auditLogs.slice(0, 6),
    itemsByClient,
    itemsByUnit,
    alerts: {
      staleMovementDays: STALE_MOVEMENT_DAYS,
      pendingDeletionRequests: deletionRequests.slice(0, 6),
      lowStockItems: lowStockItems.slice(0, 6).map((item) => ({
        ...item,
        clientName: clientNameById.get(item.clientId) || '-',
        unitName: unitNameById.get(item.unitId) || '-',
      })),
      staleItems: staleItems.slice(0, 6).map((item) => ({
        ...item,
        clientName: clientNameById.get(item.clientId) || '-',
        unitName: unitNameById.get(item.unitId) || '-',
        lastMovementAt: String(lastMovementAtByItemId.get(item.id) || item.updatedAt || item.createdAt || ''),
      })),
      emptyUnits: emptyUnits.slice(0, 6).map((unit) => ({
        ...unit,
        clientName: clientNameById.get(unit.clientId) || '-',
      })),
    },
  }
}
