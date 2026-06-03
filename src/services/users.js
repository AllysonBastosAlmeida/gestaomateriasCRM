import { createId } from '../utils/ids'
import { hashPassword } from '../utils/hashing'
import { nowIso } from '../utils/date'
import { getStorageProvider } from './storageProvider'
import { createAuditEntry } from './audit'

const storage = getStorageProvider()

function sanitizeUser(user) {
  const safeUser = { ...user }
  delete safeUser.passwordHash
  return safeUser
}

export function listUsers() {
  return storage.list('users')
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(sanitizeUser)
}

export function findUserByUsername(username) {
  return storage.list('users').find((user) => user.username === username) || null
}

export function getUserById(userId) {
  const user = storage.get('users', userId)
  return user ? sanitizeUser(user) : null
}

export function createUser(payload, actor) {
  if (findUserByUsername(payload.username)) {
    throw new Error('Ja existe um usuario com este username.')
  }

  const timestamp = nowIso()
  const user = {
    id: createId('user'),
    name: payload.name,
    email: payload.email,
    username: payload.username,
    passwordHash: hashPassword(payload.password),
    role: payload.role,
    active: payload.active ?? true,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastLoginAt: '',
  }

  storage.insert('users', user)
  createAuditEntry({
    action: 'user_created',
    entityType: 'user',
    entityId: user.id,
    entityLabel: user.name,
    user: actor,
    metadata: { role: user.role },
  })

  return sanitizeUser(user)
}

export function updateUser(userId, payload, actor) {
  const timestamp = nowIso()
  const updated = storage.update('users', userId, (current) => ({
    ...current,
    ...payload,
    passwordHash: payload.password ? hashPassword(payload.password) : current.passwordHash,
    updatedAt: timestamp,
  }))

  createAuditEntry({
    action: 'user_updated',
    entityType: 'user',
    entityId: updated.id,
    entityLabel: updated.name,
    user: actor,
    metadata: { role: updated.role, active: updated.active },
  })

  return sanitizeUser(updated)
}
