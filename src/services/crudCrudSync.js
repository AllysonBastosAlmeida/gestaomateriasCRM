import { env } from '../utils/env'
import { nowIso } from '../utils/date'
import { normalizeDatabasePayload } from '../utils/database'
import { readLocalDb, replaceLocalDb } from './localDb'

const listeners = new Set()

let bootstrapPromise = null
let pendingDb = null
let syncInFlight = false
let autoSyncTimer = null
let autoSyncStarted = false
let remoteUnavailable = false

let syncStatus = {
  isReady: false,
  inFlight: false,
  lastSyncAt: '',
  lastError: '',
  info: 'Configure a URL do CrudCrud para ativar a base online compartilhada.',
}

function emitStatus(patch) {
  syncStatus = { ...syncStatus, ...patch }
  listeners.forEach((listener) => listener(syncStatus))
}

function isConfigured() {
  return Boolean(env.crudcrud.baseUrl)
}

function createCrudCrudError(message, options = {}) {
  const error = new Error(message)
  error.code = options.code || ''
  error.isTerminal = Boolean(options.isTerminal)
  return error
}

function normalizeCrudCrudError(error) {
  if (error?.code || error?.isTerminal) {
    return error
  }

  if (error instanceof TypeError) {
    return createCrudCrudError(
      'Nao foi possivel conectar com a base online CrudCrud. O sistema segue em modo local.',
      { code: 'network_error' },
    )
  }

  return error
}

function hasOperationalRecords(db) {
  return ['clients', 'units', 'inventoryItems', 'inventoryDeletionRequests', 'stockMovements', 'auditLogs']
    .some((collectionKey) => Array.isArray(db?.[collectionKey]) && db[collectionKey].length > 0)
}

async function crudFetch(path = '', options = {}) {
  let response

  try {
    response = await fetch(`${env.crudcrud.baseUrl}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    })
  } catch (error) {
    throw normalizeCrudCrudError(error)
  }

  if (!response.ok) {
    const message = await response.text()

    if (response.status === 400 && /endpoint doesn't exist/i.test(message)) {
      throw createCrudCrudError(
        'A base online do CrudCrud expirou ou nao existe mais. O sistema segue em modo local.',
        { code: 'endpoint_missing', isTerminal: true },
      )
    }

    throw createCrudCrudError(
      message || `Falha ao comunicar com CrudCrud (${response.status}).`,
      { code: `http_${response.status}` },
    )
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

function stripRemoteId(db) {
  if (!db || typeof db !== 'object') {
    return db
  }

  const nextDb = { ...db }
  delete nextDb._id
  return nextDb
}

async function listRemoteEntries() {
  const payload = await crudFetch()
  return Array.isArray(payload) ? payload : []
}

async function upsertRemoteDb(db) {
  const entries = await listRemoteEntries()
  const body = JSON.stringify(stripRemoteId(db))

  if (!entries.length) {
    return crudFetch('', {
      method: 'POST',
      body,
    })
  }

  const [primary, ...duplicates] = entries

  await crudFetch(`/${primary._id}`, {
    method: 'PUT',
    body,
  })

  await Promise.all(
    duplicates.map((entry) => crudFetch(`/${entry._id}`, { method: 'DELETE' })),
  )

  return { ...stripRemoteId(db), _id: primary._id }
}

export function getCrudCrudSyncStatus() {
  return syncStatus
}

export function subscribeCrudCrudSync(listener) {
  listeners.add(listener)
  listener(syncStatus)
  return () => listeners.delete(listener)
}

export async function pullCrudCrudDb({ silent = false } = {}) {
  if (!isConfigured()) {
    throw new Error('CrudCrud nao configurado. Defina VITE_CRUDCRUD_BASE_URL.')
  }

  if (!silent) {
    emitStatus({
      inFlight: true,
      lastError: '',
      info: 'Carregando base online compartilhada...',
    })
  }

  try {
    const remoteEntries = await listRemoteEntries()
    remoteUnavailable = false
    const remoteDb = stripRemoteId(remoteEntries[0] || {})
    const localSnapshot = readLocalDb()

    if (!remoteEntries.length && hasOperationalRecords(localSnapshot)) {
      await pushLocalDbToCrudCrud(localSnapshot)
      const publishedDb = normalizeDatabasePayload(localSnapshot, localSnapshot)
      replaceLocalDb(publishedDb)

      emitStatus({
        isReady: true,
        inFlight: false,
        lastSyncAt: nowIso(),
        info: 'Base online vazia. O sistema publicou a base local atual no CrudCrud.',
      })

      return publishedDb
    }

    const nextDb = normalizeDatabasePayload(remoteDb, localSnapshot)
    replaceLocalDb(nextDb)

    emitStatus({
      isReady: true,
      inFlight: false,
      lastSyncAt: nowIso(),
      info: silent
        ? 'Sincronizacao automatica com CrudCrud ativa.'
        : 'Base local sincronizada a partir do CrudCrud.',
    })

    return nextDb
  } catch (error) {
    const normalizedError = normalizeCrudCrudError(error)

    if (normalizedError.isTerminal) {
      remoteUnavailable = true
    }

    if (!silent) {
      emitStatus({
        isReady: false,
        inFlight: false,
        lastError: normalizedError.message,
        info: normalizedError.isTerminal
          ? 'Base online indisponivel. O app continua operando em modo local.'
          : 'Falha ao carregar a base online. O app continua operando localmente.',
      })
    }
    throw normalizedError
  }
}

export async function pushLocalDbToCrudCrud(db = readLocalDb()) {
  if (!isConfigured()) {
    throw new Error('CrudCrud nao configurado. Defina VITE_CRUDCRUD_BASE_URL.')
  }

  emitStatus({
    inFlight: true,
    lastError: '',
    info: 'Enviando atualizacoes para a base online compartilhada...',
  })

  try {
    await upsertRemoteDb(db)
    remoteUnavailable = false

    emitStatus({
      isReady: true,
      inFlight: false,
      lastSyncAt: nowIso(),
      info: 'Base online atualizada com sucesso.',
    })
  } catch (error) {
    const normalizedError = normalizeCrudCrudError(error)

    if (normalizedError.isTerminal) {
      remoteUnavailable = true
    }

    emitStatus({
      isReady: false,
      inFlight: false,
      lastError: normalizedError.message,
      info: normalizedError.isTerminal
        ? 'Base online indisponivel. Os dados continuam salvos localmente.'
        : 'Falha ao sincronizar a base online. Os dados continuam salvos localmente.',
    })
    throw normalizedError
  }
}

async function flushSyncQueue() {
  if (syncInFlight) return
  syncInFlight = true

  try {
    while (pendingDb) {
      const snapshot = pendingDb
      pendingDb = null

      try {
        await pushLocalDbToCrudCrud(snapshot)
      } catch {
        pendingDb = pendingDb || snapshot
        break
      }
    }
  } finally {
    syncInFlight = false
  }
}

export function scheduleCrudCrudSync(db) {
  if (!isConfigured()) {
    emitStatus({
      isReady: false,
      lastError: '',
      info: 'CrudCrud nao configurado. Defina VITE_CRUDCRUD_BASE_URL.',
    })
    return
  }

  if (remoteUnavailable) {
    emitStatus({
      isReady: false,
      lastError: syncStatus.lastError,
      info: 'Base online indisponivel. Novas alteracoes seguem apenas no modo local.',
    })
    return
  }

  pendingDb = db
  void flushSyncQueue()
}

export async function syncCrudCrudNow(db = readLocalDb()) {
  if (!isConfigured()) {
    throw new Error('CrudCrud nao configurado. Defina VITE_CRUDCRUD_BASE_URL.')
  }

  remoteUnavailable = false
  pendingDb = db
  await flushSyncQueue()
  return readLocalDb()
}

export async function bootstrapCrudCrudDb() {
  if (!isConfigured()) {
    emitStatus({
      isReady: false,
      info: 'Modo CrudCrud ativo, mas VITE_CRUDCRUD_BASE_URL nao foi definido.',
    })
    return readLocalDb()
  }

  if (!bootstrapPromise) {
    bootstrapPromise = pullCrudCrudDb({ silent: false }).catch((error) => {
      bootstrapPromise = null
      throw error
    })
  }

  return bootstrapPromise
}

export async function ensureCrudCrudDbLoaded() {
  if (!isConfigured()) {
    return readLocalDb()
  }

  if (readLocalDb()?.meta?.importedAt) {
    return readLocalDb()
  }

  try {
    return await bootstrapCrudCrudDb()
  } catch {
    return readLocalDb()
  }
}

export function startCrudCrudAutoSync(intervalMs = 10000) {
  if (autoSyncStarted || !isConfigured()) {
    return () => {}
  }

  autoSyncStarted = true

  const tick = async () => {
    if (syncInFlight) {
      return
    }

    if (remoteUnavailable && !pendingDb) {
      return
    }

    if (pendingDb) {
      await flushSyncQueue()
      return
    }

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return
    }

    try {
      await pullCrudCrudDb({ silent: true })
    } catch {
      // retry on next cycle
    }
  }

  autoSyncTimer = window.setInterval(() => {
    void tick()
  }, intervalMs)

  return () => {
    if (autoSyncTimer) {
      window.clearInterval(autoSyncTimer)
      autoSyncTimer = null
    }
    autoSyncStarted = false
  }
}
