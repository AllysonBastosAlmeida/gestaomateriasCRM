import { createId } from '../utils/ids'
import { nowIso } from '../utils/date'
import { getStorageProvider } from './storageProvider'
import { createAuditEntry } from './audit'
import { requestUnitDeletion } from './inventoryDeletionRequests'

const storage = getStorageProvider()

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function assertUnitNotDuplicated(payload, currentUnitId = '') {
  const nextClientId = payload.clientId || ''
  const nextName = normalizeText(payload.name)
  const nextCode = normalizeText(payload.code)

  const duplicated = storage.list('units').find((unit) => {
    if (unit.id === currentUnitId) return false
    if (unit.clientId !== nextClientId) return false

    const sameName = nextName && normalizeText(unit.name) === nextName
    const sameCode = nextCode && normalizeText(unit.code) === nextCode

    return sameName || sameCode
  })

  if (!duplicated) {
    return
  }

  if (nextCode && normalizeText(duplicated.code) === nextCode) {
    throw new Error('Ja existe uma unidade com esse codigo para este cliente.')
  }

  throw new Error('Ja existe uma unidade com esse nome para este cliente.')
}

export function listUnits(filters = {}) {
  const { clientId = '', search = '' } = filters
  const term = search.trim().toLowerCase()

  return storage.list('units')
    .filter((unit) => {
      if (clientId && unit.clientId !== clientId) return false
      if (!term) return true
      return [unit.name, unit.code, unit.city, unit.state, unit.address].join(' ').toLowerCase().includes(term)
    })
    .sort((left, right) => left.name.localeCompare(right.name))
}

export function getUnitById(unitId) {
  return storage.get('units', unitId)
}

export function createUnit(payload, actor) {
  assertUnitNotDuplicated(payload)
  const timestamp = nowIso()
  const unit = {
    id: createId('unit'),
    clientId: payload.clientId,
    name: payload.name?.trim() || '',
    code: payload.code?.trim() || '',
    address: payload.address?.trim() || '',
    city: payload.city?.trim() || '',
    state: payload.state?.trim() || '',
    notes: payload.notes || '',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  storage.insert('units', unit)
  createAuditEntry({
    action: 'unit_created',
    entityType: 'unit',
    entityId: unit.id,
    entityLabel: unit.name,
    user: actor,
    clientId: unit.clientId,
    unitId: unit.id,
  })

  return unit
}

export function updateUnit(unitId, payload, actor) {
  const currentUnit = storage.get('units', unitId)
  if (!currentUnit) {
    throw new Error('Unidade nao encontrada.')
  }

  assertUnitNotDuplicated(
    {
      ...currentUnit,
      ...payload,
    },
    unitId,
  )

  const updated = storage.update('units', unitId, {
    ...payload,
    name: payload.name?.trim() ?? currentUnit.name,
    code: payload.code?.trim() ?? currentUnit.code,
    address: payload.address?.trim() ?? currentUnit.address,
    city: payload.city?.trim() ?? currentUnit.city,
    state: payload.state?.trim() ?? currentUnit.state,
    updatedAt: nowIso(),
  })

  createAuditEntry({
    action: 'unit_updated',
    entityType: 'unit',
    entityId: updated.id,
    entityLabel: updated.name,
    user: actor,
    clientId: updated.clientId,
    unitId: updated.id,
  })

  return updated
}

export function deleteUnit(unitId, actor) {
  return requestUnitDeletion(unitId, actor)
}
