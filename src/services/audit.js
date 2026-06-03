import { createId } from '../utils/ids'
import { nowIso } from '../utils/date'
import { getStorageProvider } from './storageProvider'

const storage = getStorageProvider()

export function createAuditEntry({
  action,
  entityType,
  entityId,
  entityLabel,
  user,
  clientId = '',
  unitId = '',
  metadata = {},
}) {
  const log = {
    id: createId('audit'),
    action,
    entityType,
    entityId,
    entityLabel,
    userId: user?.id || '',
    userName: user?.name || 'Sistema',
    clientId,
    unitId,
    metadata,
    createdAt: nowIso(),
  }

  storage.insert('auditLogs', log)
  return log
}

export function listAuditLogs(filters = {}) {
  const { search = '', userId = '', clientId = '', unitId = '', from = '', to = '' } = filters
  const term = search.trim().toLowerCase()

  return storage.list('auditLogs')
    .filter((log) => {
      if (userId && log.userId !== userId) return false
      if (clientId && log.clientId !== clientId) return false
      if (unitId && log.unitId !== unitId) return false
      if (from && log.createdAt < from) return false
      if (to && log.createdAt > `${to}T23:59:59.999Z`) return false
      if (!term) return true

      return [
        log.action,
        log.entityType,
        log.entityLabel,
        log.userName,
        JSON.stringify(log.metadata),
      ].join(' ').toLowerCase().includes(term)
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}
