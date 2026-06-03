import { listClients } from './clients'
import { listUnits } from './units'
import { listInventoryItems } from './inventory'
import { listMovements } from './movements'
import { listAuditLogs } from './audit'

export function getDashboardSnapshot() {
  const clients = listClients()
  const units = listUnits()
  const items = listInventoryItems()
  const movements = listMovements()
  const auditLogs = listAuditLogs()

  const lowStockItems = items.filter((item) => Number(item.quantity) <= Number(item.minQuantity || 0))
  const maintenanceTools = items.filter((item) => item.type === 'ferramenta' && item.status === 'manutencao')

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
    },
    lowStockItems,
    maintenanceTools,
    recentMovements: movements.slice(0, 6),
    recentAuditLogs: auditLogs.slice(0, 6),
    itemsByClient,
    itemsByUnit,
  }
}
