import { createId } from '../utils/ids'
import { nowIso } from '../utils/date'
import { buildInventorySignature } from '../utils/inventory'
import { getStorageProvider } from './storageProvider'
import { createAuditEntry } from './audit'

const storage = getStorageProvider()

function normalizeDescription(value) {
  return value?.trim() || ''
}

function validateInventoryPayload(payload, currentItem = null) {
  const description = normalizeDescription(payload.description ?? currentItem?.description)
  if (!description) {
    throw new Error('Descricao obrigatoria para salvar o item.')
  }

  const clientId = payload.clientId ?? currentItem?.clientId
  const unitId = payload.unitId ?? currentItem?.unitId
  if (!clientId || !unitId) {
    throw new Error('Selecione cliente e unidade para o item.')
  }

  const quantity = payload.quantity !== undefined ? Number(payload.quantity) : Number(currentItem?.quantity ?? 0)
  if (Number.isNaN(quantity) || quantity < 0) {
    throw new Error('Informe uma quantidade valida para o item.')
  }

  return {
    description,
    quantity,
  }
}

function assertInventoryItemNotDuplicated(payload, currentItemId = '') {
  const candidate = {
    clientId: payload.clientId || '',
    unitId: payload.unitId || '',
    type: payload.type || '',
    category: payload.category || '',
    name: payload.name?.trim() || payload.description?.trim() || '',
    sku: payload.sku || '',
    serialNumber: payload.serialNumber || '',
  }

  const signature = buildInventorySignature(candidate)

  const duplicated = storage.list('inventoryItems').find((item) => (
    item.id !== currentItemId
    && !item.pendingDeletion
    && item.clientId === candidate.clientId
    && item.unitId === candidate.unitId
    && buildInventorySignature(item) === signature
  ))

  if (duplicated) {
    throw new Error('Ja existe um item igual nessa unidade. Edite o item existente ou movimente o saldo.')
  }
}

export function listInventoryItems(filters = {}) {
  const {
    search = '',
    clientId = '',
    unitId = '',
    type = '',
    category = '',
    status = '',
    includePendingDeletion = false,
  } = filters
  const term = search.trim().toLowerCase()

  return storage.list('inventoryItems')
    .filter((item) => {
      if (!includePendingDeletion && item.pendingDeletion) return false
      if (clientId && item.clientId !== clientId) return false
      if (unitId && item.unitId !== unitId) return false
      if (type && item.type !== type) return false
      if (category && item.category !== category) return false
      if (status && item.status !== status) return false
      if (!term) return true

      return [
        item.name,
        item.description,
        item.category,
        item.sku,
        item.serialNumber,
        item.internalLocation,
      ].join(' ').toLowerCase().includes(term)
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export function getInventoryItemById(itemId) {
  return storage.get('inventoryItems', itemId)
}

export function createInventoryItem(payload, actor) {
  const { description, quantity } = validateInventoryPayload(payload)
  assertInventoryItemNotDuplicated({
    ...payload,
    name: payload.name?.trim() || description,
    description,
  })
  const timestamp = nowIso()
  const item = {
    id: createId('item'),
    clientId: payload.clientId,
    unitId: payload.unitId,
    type: payload.type,
    category: payload.category,
    name: payload.name?.trim() || description,
    description,
    sku: payload.sku || '',
    serialNumber: payload.serialNumber || '',
    quantity,
    minQuantity: Number(payload.minQuantity || 0),
    unitMeasure: payload.unitMeasure || 'un',
    status: payload.status,
    internalLocation: payload.internalLocation || '',
    notes: payload.notes || '',
    pendingDeletion: false,
    pendingDeletionRequestId: '',
    pendingDeletionRequestedAt: '',
    pendingDeletionRequestedBy: '',
    activityHighlightAt: timestamp,
    activityHighlightType: 'created',
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: actor.id,
    updatedBy: actor.id,
  }

  storage.insert('inventoryItems', item)
  createAuditEntry({
    action: 'inventory_item_created',
    entityType: 'inventoryItem',
    entityId: item.id,
    entityLabel: item.name,
    user: actor,
    clientId: item.clientId,
    unitId: item.unitId,
    metadata: { quantity: item.quantity, type: item.type },
  })

  return item
}

export function updateInventoryItem(itemId, payload, actor) {
  const currentItem = storage.get('inventoryItems', itemId)
  if (!currentItem) {
    throw new Error('Item de estoque nao encontrado.')
  }

  if (currentItem.pendingDeletion) {
    throw new Error('Este item esta com exclusao pendente e nao pode ser alterado agora.')
  }

  const { description, quantity } = validateInventoryPayload(payload, currentItem)
  assertInventoryItemNotDuplicated({
    ...currentItem,
    ...payload,
    name: payload.name?.trim() || description,
    description,
  }, itemId)
  const updated = storage.update('inventoryItems', itemId, (current) => ({
    ...current,
    ...payload,
    name: payload.name?.trim() || description,
    description,
    quantity,
    minQuantity: payload.minQuantity !== undefined ? Number(payload.minQuantity) : current.minQuantity,
    updatedAt: nowIso(),
    updatedBy: actor.id,
  }))

  createAuditEntry({
    action: 'inventory_item_updated',
    entityType: 'inventoryItem',
    entityId: updated.id,
    entityLabel: updated.name,
    user: actor,
    clientId: updated.clientId,
    unitId: updated.unitId,
    metadata: { quantity: updated.quantity, status: updated.status },
  })

  return updated
}

export function markInventoryItemAsInactive(itemId, actor) {
  return updateInventoryItem(itemId, { status: 'baixado' }, actor)
}

export function findMatchingInventoryItem(items, referenceItem, destinationUnitId, destinationClientId) {
  const signature = buildInventorySignature(referenceItem)
  return items.find((item) => (
    !item.pendingDeletion
    && item.id !== referenceItem.id
    && item.unitId === destinationUnitId
    && item.clientId === destinationClientId
    && buildInventorySignature(item) === signature
  )) || null
}
