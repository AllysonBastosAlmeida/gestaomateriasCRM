import { createId } from '../utils/ids'
import { nowIso } from '../utils/date'
import { getStorageProvider } from './storageProvider'

const storage = getStorageProvider()

export const DELETION_REQUEST_STATUSES = {
  pending: 'pendente',
  approved: 'aprovada',
  rejected: 'recusada',
}

function createAuditLog(action, item, actor, metadata = {}) {
  return {
    id: createId('audit'),
    action,
    entityType: 'inventoryDeletionRequest',
    entityId: metadata.requestId || '',
    entityLabel: item.name,
    userId: actor?.id || '',
    userName: actor?.name || 'Sistema',
    clientId: item.clientId || '',
    unitId: item.unitId || '',
    metadata,
    createdAt: nowIso(),
  }
}

function buildSnapshot(item) {
  return JSON.stringify({
    ...item,
    pendingDeletion: false,
    pendingDeletionRequestId: '',
    pendingDeletionRequestedAt: '',
    pendingDeletionRequestedBy: '',
  })
}

function parseSnapshot(request) {
  try {
    return JSON.parse(request.itemSnapshotJson || '{}')
  } catch {
    return null
  }
}

export function listInventoryDeletionRequests(filters = {}) {
  const {
    status = '',
    clientId = '',
    unitId = '',
    search = '',
  } = filters
  const term = search.trim().toLowerCase()

  return storage.list('inventoryDeletionRequests')
    .filter((request) => {
      if (status && request.status !== status) return false
      if (clientId && request.clientId !== clientId) return false
      if (unitId && request.unitId !== unitId) return false
      if (!term) return true

      return [
        request.itemName,
        request.requestedByName,
        request.reviewedByName,
        request.reviewNotes,
      ].join(' ').toLowerCase().includes(term)
    })
    .sort((left, right) => {
      if (left.status === DELETION_REQUEST_STATUSES.pending && right.status !== DELETION_REQUEST_STATUSES.pending) return -1
      if (left.status !== DELETION_REQUEST_STATUSES.pending && right.status === DELETION_REQUEST_STATUSES.pending) return 1
      return right.requestedAt.localeCompare(left.requestedAt)
    })
}

export function requestInventoryItemDeletion(itemId, actor) {
  return storage.transaction((db) => {
    const items = db.inventoryItems || []
    const requests = db.inventoryDeletionRequests || []
    const item = items.find((entry) => entry.id === itemId)

    if (!item) {
      throw new Error('Item de estoque nao encontrado.')
    }

    if (item.pendingDeletion) {
      throw new Error('Este item ja esta aguardando aprovacao de exclusao.')
    }

    const timestamp = nowIso()
    const request = {
      id: createId('delreq'),
      itemId: item.id,
      itemName: item.name,
      clientId: item.clientId,
      unitId: item.unitId,
      status: DELETION_REQUEST_STATUSES.pending,
      requestedBy: actor.id,
      requestedByName: actor.name,
      requestedAt: timestamp,
      reviewedBy: '',
      reviewedByName: '',
      reviewedAt: '',
      reviewNotes: '',
      itemSnapshotJson: buildSnapshot(item),
    }

    item.pendingDeletion = true
    item.pendingDeletionRequestId = request.id
    item.pendingDeletionRequestedAt = timestamp
    item.pendingDeletionRequestedBy = actor.id
    item.updatedAt = timestamp
    item.updatedBy = actor.id

    requests.push(request)
    db.inventoryDeletionRequests = requests
    db.auditLogs.push(createAuditLog('inventory_item_deletion_requested', item, actor, {
      requestId: request.id,
      requestStatus: request.status,
    }))

    return request
  })
}

export function approveInventoryItemDeletion(requestId, actor, reviewNotes = '') {
  return storage.transaction((db) => {
    const requests = db.inventoryDeletionRequests || []
    const request = requests.find((entry) => entry.id === requestId)

    if (!request) {
      throw new Error('Solicitacao de exclusao nao encontrada.')
    }

    if (request.status !== DELETION_REQUEST_STATUSES.pending) {
      throw new Error('Essa solicitacao ja foi analisada.')
    }

    const timestamp = nowIso()
    const itemIndex = (db.inventoryItems || []).findIndex((entry) => entry.id === request.itemId)
    const item = itemIndex >= 0
      ? db.inventoryItems[itemIndex]
      : parseSnapshot(request)

    if (itemIndex >= 0) {
      db.inventoryItems.splice(itemIndex, 1)
    }

    request.status = DELETION_REQUEST_STATUSES.approved
    request.reviewedBy = actor.id
    request.reviewedByName = actor.name
    request.reviewedAt = timestamp
    request.reviewNotes = reviewNotes?.trim() || ''

    if (item) {
      db.auditLogs.push(createAuditLog('inventory_item_deletion_approved', item, actor, {
        requestId: request.id,
        requestStatus: request.status,
      }))
    }

    return request
  })
}

export function rejectInventoryItemDeletion(requestId, actor, reviewNotes = '') {
  return storage.transaction((db) => {
    const requests = db.inventoryDeletionRequests || []
    const request = requests.find((entry) => entry.id === requestId)

    if (!request) {
      throw new Error('Solicitacao de exclusao nao encontrada.')
    }

    if (request.status !== DELETION_REQUEST_STATUSES.pending) {
      throw new Error('Essa solicitacao ja foi analisada.')
    }

    const timestamp = nowIso()
    const snapshot = parseSnapshot(request)
    if (!snapshot) {
      throw new Error('Nao foi possivel restaurar o item solicitado.')
    }

    const items = db.inventoryItems || []
    const itemIndex = items.findIndex((entry) => entry.id === request.itemId)
    const restoredItem = {
      ...snapshot,
      pendingDeletion: false,
      pendingDeletionRequestId: '',
      pendingDeletionRequestedAt: '',
      pendingDeletionRequestedBy: '',
      updatedAt: timestamp,
      updatedBy: actor.id,
    }

    if (itemIndex >= 0) {
      items[itemIndex] = restoredItem
    } else {
      items.push(restoredItem)
    }

    request.status = DELETION_REQUEST_STATUSES.rejected
    request.reviewedBy = actor.id
    request.reviewedByName = actor.name
    request.reviewedAt = timestamp
    request.reviewNotes = reviewNotes?.trim() || ''

    db.auditLogs.push(createAuditLog('inventory_item_deletion_rejected', restoredItem, actor, {
      requestId: request.id,
      requestStatus: request.status,
    }))

    return request
  })
}
