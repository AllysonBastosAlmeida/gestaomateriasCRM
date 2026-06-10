import { createId } from '../utils/ids'
import { nowIso } from '../utils/date'
import { getStorageProvider } from './storageProvider'

const storage = getStorageProvider()

export const DELETION_REQUEST_STATUSES = {
  pending: 'pendente',
  approved: 'aprovada',
  rejected: 'recusada',
}

export const DELETION_REQUEST_TYPES = {
  item: 'item',
  unit: 'unit',
}

function createAuditLog(action, entity, actor, metadata = {}) {
  return {
    id: createId('audit'),
    action,
    entityType: 'inventoryDeletionRequest',
    entityId: metadata.requestId || '',
    entityLabel: entity.name,
    userId: actor?.id || '',
    userName: actor?.name || 'Sistema',
    clientId: entity.clientId || '',
    unitId: entity.unitId || entity.id || '',
    metadata,
    createdAt: nowIso(),
  }
}

function buildItemSnapshot(item) {
  return JSON.stringify({
    ...item,
    pendingDeletion: false,
    pendingDeletionRequestId: '',
    pendingDeletionRequestedAt: '',
    pendingDeletionRequestedBy: '',
  })
}

function buildUnitSnapshot(unit, items = []) {
  return JSON.stringify({
    unit,
    items: items.map((item) => ({
      ...item,
      pendingDeletion: false,
      pendingDeletionRequestId: '',
      pendingDeletionRequestedAt: '',
      pendingDeletionRequestedBy: '',
    })),
  })
}

function parseJsonSnapshot(value) {
  try {
    return JSON.parse(value || '{}')
  } catch {
    return null
  }
}

function getPendingOrApprovedUnitIds(requests = []) {
  return new Set(
    requests
      .filter((request) => (
        request?.requestType === DELETION_REQUEST_TYPES.unit
        && [DELETION_REQUEST_STATUSES.pending, DELETION_REQUEST_STATUSES.approved].includes(request.status)
        && request.unitId
      ))
      .map((request) => request.unitId),
  )
}

export function listInventoryDeletionRequests(filters = {}) {
  const {
    status = '',
    clientId = '',
    unitId = '',
    requestedBy = '',
    search = '',
  } = filters
  const term = search.trim().toLowerCase()
  const allRequests = storage.list('inventoryDeletionRequests')
  const hiddenUnitIds = getPendingOrApprovedUnitIds(allRequests)

  return allRequests
    .filter((request) => {
      if (
        request.requestType === DELETION_REQUEST_TYPES.item
        && request.unitId
        && hiddenUnitIds.has(request.unitId)
      ) {
        return false
      }

      if (status && request.status !== status) return false
      if (clientId && request.clientId !== clientId) return false
      if (unitId && request.unitId !== unitId) return false
      if (requestedBy && request.requestedBy !== requestedBy) return false
      if (!term) return true

      return [
        request.itemName,
        request.requestedByName,
        request.reviewedByName,
        request.reviewNotes,
        request.requestType,
      ].join(' ').toLowerCase().includes(term)
    })
    .sort((left, right) => {
      if (left.status === DELETION_REQUEST_STATUSES.pending && right.status !== DELETION_REQUEST_STATUSES.pending) return -1
      if (left.status !== DELETION_REQUEST_STATUSES.pending && right.status === DELETION_REQUEST_STATUSES.pending) return 1
      return String(right.requestedAt || '').localeCompare(String(left.requestedAt || ''))
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
      requestType: DELETION_REQUEST_TYPES.item,
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
      itemSnapshotJson: buildItemSnapshot(item),
      unitSnapshotJson: '',
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
      requestType: request.requestType,
    }))

    return request
  })
}

export function requestUnitDeletion(unitId, actor) {
  return storage.transaction((db) => {
    const units = db.units || []
    const requests = db.inventoryDeletionRequests || []
    const unit = units.find((entry) => entry.id === unitId)

    if (!unit) {
      throw new Error('Unidade nao encontrada.')
    }

    const existingPending = requests.find((request) => (
      request.requestType === DELETION_REQUEST_TYPES.unit
      && request.unitId === unitId
      && request.status === DELETION_REQUEST_STATUSES.pending
    ))

    if (existingPending) {
      throw new Error('Esta unidade ja esta aguardando aprovacao de exclusao.')
    }

    const items = (db.inventoryItems || []).filter((item) => item.unitId === unitId)
    const timestamp = nowIso()
    const request = {
      id: createId('delreq'),
      requestType: DELETION_REQUEST_TYPES.unit,
      itemId: '',
      itemName: unit.name,
      clientId: unit.clientId,
      unitId: unit.id,
      status: DELETION_REQUEST_STATUSES.pending,
      requestedBy: actor.id,
      requestedByName: actor.name,
      requestedAt: timestamp,
      reviewedBy: '',
      reviewedByName: '',
      reviewedAt: '',
      reviewNotes: '',
      itemSnapshotJson: '',
      unitSnapshotJson: buildUnitSnapshot(unit, items),
    }

    db.units = units.filter((entry) => entry.id !== unitId)
    db.inventoryItems = (db.inventoryItems || []).filter((item) => item.unitId !== unitId)
    requests.push(request)
    db.inventoryDeletionRequests = requests
    db.auditLogs.push(createAuditLog('unit_deletion_requested', unit, actor, {
      requestId: request.id,
      requestStatus: request.status,
      requestType: request.requestType,
      removedItemsCount: items.length,
    }))

    return {
      request,
      removedItemsCount: items.length,
    }
  })
}

function approveItemDeletionRequest(db, request, actor, reviewNotes) {
  const timestamp = nowIso()
  const itemIndex = (db.inventoryItems || []).findIndex((entry) => entry.id === request.itemId)
  const item = itemIndex >= 0
    ? db.inventoryItems[itemIndex]
    : parseJsonSnapshot(request.itemSnapshotJson)

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
      requestType: request.requestType,
    }))
  }

  return request
}

function approveUnitDeletionRequest(db, request, actor, reviewNotes) {
  const timestamp = nowIso()
  const snapshot = parseJsonSnapshot(request.unitSnapshotJson)
  const unit = snapshot?.unit || null
  const items = Array.isArray(snapshot?.items) ? snapshot.items : []

  if (!db.deletionMarks || typeof db.deletionMarks !== 'object') {
    db.deletionMarks = {}
  }

  if (!Array.isArray(db.deletionMarks.units)) db.deletionMarks.units = []
  if (!Array.isArray(db.deletionMarks.inventoryItems)) db.deletionMarks.inventoryItems = []

  const unitMarks = new Set(db.deletionMarks.units.map((mark) => mark.id))
  const itemMarks = new Set(db.deletionMarks.inventoryItems.map((mark) => mark.id))

  if (unit?.id && !unitMarks.has(unit.id)) {
    db.deletionMarks.units.push({ id: unit.id, deletedAt: timestamp })
  }

  for (const item of items) {
    if (item?.id && !itemMarks.has(item.id)) {
      db.deletionMarks.inventoryItems.push({ id: item.id, deletedAt: timestamp })
    }
  }

  request.status = DELETION_REQUEST_STATUSES.approved
  request.reviewedBy = actor.id
  request.reviewedByName = actor.name
  request.reviewedAt = timestamp
  request.reviewNotes = reviewNotes?.trim() || ''

  if (unit) {
    db.auditLogs.push(createAuditLog('unit_deletion_approved', unit, actor, {
      requestId: request.id,
      requestStatus: request.status,
      requestType: request.requestType,
      removedItemsCount: items.length,
    }))
  }

  return request
}

export function approveDeletionRequest(requestId, actor, reviewNotes = '') {
  return storage.transaction((db) => {
    const requests = db.inventoryDeletionRequests || []
    const request = requests.find((entry) => entry.id === requestId)

    if (!request) {
      throw new Error('Solicitacao de exclusao nao encontrada.')
    }

    if (request.status !== DELETION_REQUEST_STATUSES.pending) {
      throw new Error('Essa solicitacao ja foi analisada.')
    }

    if (request.requestType === DELETION_REQUEST_TYPES.unit) {
      return approveUnitDeletionRequest(db, request, actor, reviewNotes)
    }

    return approveItemDeletionRequest(db, request, actor, reviewNotes)
  })
}

function rejectItemDeletionRequest(db, request, actor, reviewNotes) {
  const timestamp = nowIso()
  const snapshot = parseJsonSnapshot(request.itemSnapshotJson)
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
    requestType: request.requestType,
  }))

  return request
}

function rejectUnitDeletionRequest(db, request, actor, reviewNotes) {
  const timestamp = nowIso()
  const snapshot = parseJsonSnapshot(request.unitSnapshotJson)
  const restoredUnit = snapshot?.unit
  const restoredItems = Array.isArray(snapshot?.items) ? snapshot.items : []

  if (!restoredUnit) {
    throw new Error('Nao foi possivel restaurar a unidade solicitada.')
  }

  const units = db.units || []
  const unitIndex = units.findIndex((entry) => entry.id === restoredUnit.id)
  const nextUnit = {
    ...restoredUnit,
    updatedAt: timestamp,
  }

  if (unitIndex >= 0) {
    units[unitIndex] = nextUnit
  } else {
    units.push(nextUnit)
  }

  const items = db.inventoryItems || []
  const hiddenItemIds = new Set(restoredItems.map((item) => item.id))
  db.inventoryItems = items.filter((item) => !hiddenItemIds.has(item.id))

  for (const restoredItem of restoredItems) {
    db.inventoryItems.push({
      ...restoredItem,
      pendingDeletion: false,
      pendingDeletionRequestId: '',
      pendingDeletionRequestedAt: '',
      pendingDeletionRequestedBy: '',
      updatedAt: timestamp,
      updatedBy: actor.id,
    })
  }

  request.status = DELETION_REQUEST_STATUSES.rejected
  request.reviewedBy = actor.id
  request.reviewedByName = actor.name
  request.reviewedAt = timestamp
  request.reviewNotes = reviewNotes?.trim() || ''

  db.auditLogs.push(createAuditLog('unit_deletion_rejected', nextUnit, actor, {
    requestId: request.id,
    requestStatus: request.status,
    requestType: request.requestType,
    restoredItemsCount: restoredItems.length,
  }))

  return request
}

export function rejectDeletionRequest(requestId, actor, reviewNotes = '') {
  return storage.transaction((db) => {
    const requests = db.inventoryDeletionRequests || []
    const request = requests.find((entry) => entry.id === requestId)

    if (!request) {
      throw new Error('Solicitacao de exclusao nao encontrada.')
    }

    if (request.status !== DELETION_REQUEST_STATUSES.pending) {
      throw new Error('Essa solicitacao ja foi analisada.')
    }

    if (request.requestType === DELETION_REQUEST_TYPES.unit) {
      return rejectUnitDeletionRequest(db, request, actor, reviewNotes)
    }

    return rejectItemDeletionRequest(db, request, actor, reviewNotes)
  })
}

export function approveInventoryItemDeletion(requestId, actor, reviewNotes = '') {
  return approveDeletionRequest(requestId, actor, reviewNotes)
}

export function rejectInventoryItemDeletion(requestId, actor, reviewNotes = '') {
  return rejectDeletionRequest(requestId, actor, reviewNotes)
}
