import { nowIso } from './date'

export function normalizeDatabasePayload(data, currentDb = {}) {
  const sourceDeletionMarks = data.deletionMarks || currentDb.deletionMarks || {}

  return {
    ...currentDb,
    ...data,
    meta: {
      ...(currentDb.meta || {}),
      importedAt: nowIso(),
    },
    settings: {
      ...(currentDb.settings || {}),
      ...(data.settings || {}),
    },
    deletionMarks: {
      units: Array.isArray(sourceDeletionMarks.units) ? sourceDeletionMarks.units : [],
      inventoryItems: Array.isArray(sourceDeletionMarks.inventoryItems) ? sourceDeletionMarks.inventoryItems : [],
      inventoryDeletionRequests: Array.isArray(sourceDeletionMarks.inventoryDeletionRequests) ? sourceDeletionMarks.inventoryDeletionRequests : [],
      stockMovements: Array.isArray(sourceDeletionMarks.stockMovements) ? sourceDeletionMarks.stockMovements : [],
      auditLogs: Array.isArray(sourceDeletionMarks.auditLogs) ? sourceDeletionMarks.auditLogs : [],
    },
    clients: (data.clients || []).map((client) => ({
      ...client,
      logoDataUrl: client.logoDataUrl || '',
      logoFileName: client.logoFileName || '',
      logoItemId: client.logoItemId || '',
      logoUploadedAt: client.logoUploadedAt || '',
    })),
    users: (data.users || []).map((user) => ({
      ...user,
      active: user.active === true || user.active === 'true' || user.active === '1',
    })),
    inventoryItems: (data.inventoryItems || []).map((item) => ({
      ...item,
      quantity: Number(item.quantity || 0),
      minQuantity: Number(item.minQuantity || 0),
      pendingDeletion: item.pendingDeletion === true || item.pendingDeletion === 'true' || item.pendingDeletion === '1',
      activityHighlightAt: item.activityHighlightAt || '',
      activityHighlightType: item.activityHighlightType || '',
    })),
    inventoryDeletionRequests: (data.inventoryDeletionRequests || []).map((request) => ({
      ...request,
    })),
    stockMovements: (data.stockMovements || []).map((movement) => ({
      ...movement,
      quantity: Number(movement.quantity || 0),
      previousQuantity: Number(movement.previousQuantity || 0),
      newQuantity: Number(movement.newQuantity || 0),
    })),
    auditLogs: (data.auditLogs || []).map((log) => ({
      ...log,
      metadata: typeof log.metadata === 'string' ? { raw: log.metadata } : log.metadata,
    })),
  }
}
