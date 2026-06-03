import { ROLES } from './constants'

export function canManageUsers(user) {
  return user?.role === ROLES.admin
}

export function canManageClients(user) {
  return user?.role === ROLES.admin
}

export function canViewAudit(user) {
  return user?.role === ROLES.admin
}

export function canViewMovementLog(user) {
  return user?.role === ROLES.admin
}

export function canReviewDeletionRequests(user) {
  return user?.role === ROLES.admin
}

export function canEditInventory(user) {
  return Boolean(user?.active)
}
