import { createId } from '../utils/ids'
import { nowIso } from '../utils/date'
import { getStorageProvider } from './storageProvider'
import { findMatchingInventoryItem } from './inventory'

const storage = getStorageProvider()

function createMovementRecord({
  itemId,
  movementType,
  clientId,
  unitId,
  sourceUnitId = '',
  destinationUnitId = '',
  quantity,
  previousQuantity,
  newQuantity,
  reason,
  notes,
  performedBy,
}) {
  return {
    id: createId('mov'),
    itemId,
    movementType,
    clientId,
    unitId,
    sourceUnitId,
    destinationUnitId,
    quantity,
    previousQuantity,
    newQuantity,
    reason,
    notes,
    performedBy,
    performedAt: nowIso(),
  }
}

function buildAuditMetadata(movement, extra = {}) {
  return {
    quantity: movement.quantity,
    previousQuantity: movement.previousQuantity,
    newQuantity: movement.newQuantity,
    sourceUnitId: movement.sourceUnitId,
    destinationUnitId: movement.destinationUnitId,
    reason: movement.reason,
    notes: movement.notes,
    ...extra,
  }
}

export function listMovements(filters = {}) {
  const {
    search = '',
    movementType = '',
    clientId = '',
    unitId = '',
    userId = '',
    from = '',
    to = '',
  } = filters
  const term = search.trim().toLowerCase()

  return storage.list('stockMovements')
    .filter((movement) => {
      if (movementType && movement.movementType !== movementType) return false
      if (clientId && movement.clientId !== clientId) return false
      if (unitId && movement.unitId !== unitId && movement.sourceUnitId !== unitId && movement.destinationUnitId !== unitId) return false
      if (userId && movement.performedBy !== userId) return false
      if (from && movement.performedAt < from) return false
      if (to && movement.performedAt > `${to}T23:59:59.999Z`) return false
      if (!term) return true

      return [movement.reason, movement.notes, movement.movementType].join(' ').toLowerCase().includes(term)
    })
    .sort((left, right) => right.performedAt.localeCompare(left.performedAt))
}

export function listItemMovementHistory(itemId) {
  return listMovements().filter((movement) => movement.itemId === itemId)
}

export function performMovement({ itemId, movementType, quantity, reason, notes, destinationUnitId }, actor) {
  const parsedQuantity = Number(quantity)
  if (!(parsedQuantity > 0)) {
    throw new Error('Informe uma quantidade valida.')
  }

  return storage.transaction((db) => {
    const items = db.inventoryItems || []
    const units = db.units || []
    const item = items.find((entry) => entry.id === itemId)

    if (!item) {
      throw new Error('Item de estoque nao encontrado.')
    }

    if (item.pendingDeletion) {
      throw new Error('Este item esta com exclusao pendente e nao pode ser movimentado.')
    }

    const sourceClientId = item.clientId
    const sourceUnitId = item.unitId
    const currentQuantity = Number(item.quantity)
    const timestamp = nowIso()
    const isFullTransfer = movementType === 'transferencia' && parsedQuantity === currentQuantity

    if ((movementType === 'saida' || movementType === 'transferencia') && parsedQuantity > currentQuantity) {
      throw new Error('A quantidade informada excede o saldo disponivel.')
    }

    if (movementType === 'ajuste' && !reason?.trim()) {
      throw new Error('Motivo obrigatorio para ajuste.')
    }

    if (movementType === 'transferencia' && !destinationUnitId) {
      throw new Error('Selecione a unidade de destino.')
    }

    let movement

    if (movementType === 'entrada') {
      item.quantity = currentQuantity + parsedQuantity
      item.updatedAt = timestamp
      item.updatedBy = actor.id
      movement = createMovementRecord({
        itemId,
        movementType,
        clientId: item.clientId,
        unitId: item.unitId,
        quantity: parsedQuantity,
        previousQuantity: currentQuantity,
        newQuantity: item.quantity,
        reason,
        notes,
        performedBy: actor.id,
      })
    }

    if (movementType === 'saida') {
      item.quantity = currentQuantity - parsedQuantity
      item.updatedAt = timestamp
      item.updatedBy = actor.id
      movement = createMovementRecord({
        itemId,
        movementType,
        clientId: item.clientId,
        unitId: item.unitId,
        quantity: parsedQuantity,
        previousQuantity: currentQuantity,
        newQuantity: item.quantity,
        reason,
        notes,
        performedBy: actor.id,
      })
    }

    if (movementType === 'ajuste') {
      const adjustedQuantity = parsedQuantity
      item.quantity = adjustedQuantity
      item.updatedAt = timestamp
      item.updatedBy = actor.id
      movement = createMovementRecord({
        itemId,
        movementType,
        clientId: item.clientId,
        unitId: item.unitId,
        quantity: Math.abs(adjustedQuantity - currentQuantity),
        previousQuantity: currentQuantity,
        newQuantity: item.quantity,
        reason,
        notes,
        performedBy: actor.id,
      })
    }

    if (movementType === 'transferencia') {
      const destinationUnit = units.find((unit) => unit.id === destinationUnitId)
      if (!destinationUnit) {
        throw new Error('Unidade de destino nao encontrada.')
      }

      const destinationItem = findMatchingInventoryItem(items, item, destinationUnitId, destinationUnit.clientId)

      if (destinationItem) {
        item.quantity = currentQuantity - parsedQuantity
        item.updatedAt = timestamp
        item.updatedBy = actor.id

        destinationItem.quantity = Number(destinationItem.quantity) + parsedQuantity
        destinationItem.updatedAt = timestamp
        destinationItem.updatedBy = actor.id
        destinationItem.activityHighlightAt = timestamp
        destinationItem.activityHighlightType = 'moved'

        if (item.quantity === 0) {
          const sourceIndex = items.findIndex((entry) => entry.id === item.id)
          if (sourceIndex >= 0) {
            items.splice(sourceIndex, 1)
          }
        }
      } else if (isFullTransfer) {
        item.clientId = destinationUnit.clientId
        item.unitId = destinationUnit.id
        item.updatedAt = timestamp
        item.updatedBy = actor.id
        item.activityHighlightAt = timestamp
        item.activityHighlightType = 'moved'
      } else {
        item.quantity = currentQuantity - parsedQuantity
        item.updatedAt = timestamp
        item.updatedBy = actor.id

        items.push({
          ...item,
          id: createId('item'),
          clientId: destinationUnit.clientId,
          unitId: destinationUnit.id,
          quantity: parsedQuantity,
          activityHighlightAt: timestamp,
          activityHighlightType: 'moved',
          createdAt: timestamp,
          updatedAt: timestamp,
          createdBy: actor.id,
          updatedBy: actor.id,
        })
      }

      movement = createMovementRecord({
        itemId,
        movementType,
        clientId: sourceClientId,
        unitId: sourceUnitId,
        sourceUnitId,
        destinationUnitId,
        quantity: parsedQuantity,
        previousQuantity: currentQuantity,
        newQuantity: currentQuantity - parsedQuantity,
        reason,
        notes,
        performedBy: actor.id,
      })
    }

    db.stockMovements.push(movement)
    db.auditLogs.push({
      id: createId('audit'),
      action: `movement_${movementType}`,
      entityType: 'movement',
      entityId: movement.id,
      entityLabel: item.name,
      userId: actor.id,
      userName: actor.name,
      clientId: sourceClientId || item.clientId,
      unitId: sourceUnitId || item.unitId,
      metadata: buildAuditMetadata(movement),
      createdAt: timestamp,
    })

    return movement
  })
}
