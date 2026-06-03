import { clearSession, getSession, setSession } from './session'
import { findUserByUsername } from './users'
import { hashPassword } from '../utils/hashing'
import { getStorageProvider } from './storageProvider'
import { createAuditEntry } from './audit'
import { nowIso } from '../utils/date'

const storage = getStorageProvider()

function sanitizeUser(user) {
  if (!user) return null
  const safeUser = { ...user }
  delete safeUser.passwordHash
  return safeUser
}

export function getCurrentUser() {
  const session = getSession()
  if (!session?.userId) return null

  const user = storage.get('users', session.userId)
  if (!user || !user.active) {
    clearSession()
    return null
  }

  return sanitizeUser(user)
}

export function login(username, password) {
  const user = findUserByUsername(username)
  if (!user || !user.active || user.passwordHash !== hashPassword(password)) {
    throw new Error('Usuario ou senha invalidos.')
  }

  const timestamp = nowIso()
  storage.update('users', user.id, { lastLoginAt: timestamp, updatedAt: timestamp })
  setSession({ userId: user.id, loggedAt: timestamp })

  createAuditEntry({
    action: 'auth_login',
    entityType: 'session',
    entityId: user.id,
    entityLabel: user.name,
    user,
    metadata: { username: user.username },
  })

  return sanitizeUser({ ...user, lastLoginAt: timestamp, updatedAt: timestamp })
}

export function logout(user) {
  if (user) {
    createAuditEntry({
      action: 'auth_logout',
      entityType: 'session',
      entityId: user.id,
      entityLabel: user.name,
      user,
    })
  }

  clearSession()
}
