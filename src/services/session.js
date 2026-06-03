import { env } from '../utils/env'

export function getSession() {
  try {
    const raw = sessionStorage.getItem(env.sessionKey)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(session) {
  sessionStorage.setItem(env.sessionKey, JSON.stringify(session))
}

export function clearSession() {
  sessionStorage.removeItem(env.sessionKey)
  localStorage.removeItem(env.sessionKey)
}
