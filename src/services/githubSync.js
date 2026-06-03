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
  info: 'Configure a base compartilhada do GitHub para ativar o modo online.',
}

function emitStatus(patch) {
  syncStatus = { ...syncStatus, ...patch }
  listeners.forEach((listener) => listener(syncStatus))
}

function isConfigured() {
  return Boolean(
    env.github.owner
    && env.github.repo
    && env.github.branch
    && env.github.filePath
    && env.github.token,
  )
}

function getContentsUrl() {
  const encodedPath = env.github.filePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `https://api.github.com/repos/${env.github.owner}/${env.github.repo}/contents/${encodedPath}`
}

function createGitHubError(message, options = {}) {
  const error = new Error(message)
  error.code = options.code || ''
  error.isTerminal = Boolean(options.isTerminal)
  error.status = options.status || 0
  return error
}

function normalizeGitHubError(error) {
  if (error?.code || error?.status) {
    return error
  }

  if (error instanceof TypeError) {
    return createGitHubError(
      'Nao foi possivel conectar com a base online do GitHub. O sistema segue em modo local.',
      { code: 'network_error' },
    )
  }

  return error
}

function encodeBase64(value) {
  const utf8 = new TextEncoder().encode(value)
  let binary = ''
  utf8.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function decodeBase64(value) {
  const binary = atob(value.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

async function githubFetch(url, options = {}) {
  let response

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${env.github.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    })
  } catch (error) {
    throw normalizeGitHubError(error)
  }

  if (!response.ok) {
    let message

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const payload = await response.json()
      message = payload?.message || ''
    } else {
      message = await response.text()
    }

    if (response.status === 404) {
      throw createGitHubError('Arquivo compartilhado ainda nao criado no GitHub.', {
        code: 'file_missing',
        status: response.status,
      })
    }

    if (response.status === 409) {
      throw createGitHubError('Conflito ao atualizar a base compartilhada. O sistema vai tentar novamente.', {
        code: 'conflict',
        status: response.status,
      })
    }

    if (response.status === 401 || response.status === 403) {
      throw createGitHubError(
        message || 'Credencial do GitHub rejeitada para a base compartilhada.',
        { code: 'auth_error', status: response.status, isTerminal: true },
      )
    }

    throw createGitHubError(
      message || `Falha ao comunicar com o GitHub (${response.status}).`,
      { code: `http_${response.status}`, status: response.status },
    )
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

function hasOperationalRecords(db) {
  return ['clients', 'units', 'inventoryItems', 'inventoryDeletionRequests', 'stockMovements', 'auditLogs']
    .some((collectionKey) => Array.isArray(db?.[collectionKey]) && db[collectionKey].length > 0)
}

async function readRemoteSnapshot() {
  try {
    const payload = await githubFetch(`${getContentsUrl()}?ref=${encodeURIComponent(env.github.branch)}`)
    const content = payload?.content ? decodeBase64(payload.content) : '{}'
    const parsed = JSON.parse(content)
    return {
      db: parsed,
      sha: payload.sha,
    }
  } catch (error) {
    const normalizedError = normalizeGitHubError(error)
    if (normalizedError.code === 'file_missing') {
      return null
    }
    throw normalizedError
  }
}

async function writeRemoteSnapshot(db, sha = '') {
  const body = {
    message: `Atualiza base compartilhada do CRM em ${nowIso()}`,
    content: encodeBase64(JSON.stringify(db, null, 2)),
    branch: env.github.branch,
  }

  if (sha) {
    body.sha = sha
  }

  return githubFetch(getContentsUrl(), {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

async function upsertRemoteDb(db) {
  const remoteSnapshot = await readRemoteSnapshot()
  const normalizedDb = JSON.parse(JSON.stringify(db))

  try {
    const payload = await writeRemoteSnapshot(normalizedDb, remoteSnapshot?.sha || '')
    return payload
  } catch (error) {
    const normalizedError = normalizeGitHubError(error)

    if (normalizedError.code === 'conflict') {
      const latestSnapshot = await readRemoteSnapshot()
      return writeRemoteSnapshot(normalizedDb, latestSnapshot?.sha || '')
    }

    throw normalizedError
  }
}

export function getGitHubSyncStatus() {
  return syncStatus
}

export function subscribeGitHubSync(listener) {
  listeners.add(listener)
  listener(syncStatus)
  return () => listeners.delete(listener)
}

export async function pullGitHubDb({ silent = false } = {}) {
  if (!isConfigured()) {
    throw new Error('GitHub nao configurado. Defina owner, repo, branch, filePath e token.')
  }

  if (!silent) {
    emitStatus({
      inFlight: true,
      lastError: '',
      info: 'Carregando base online compartilhada do GitHub...',
    })
  }

  try {
    const remoteSnapshot = await readRemoteSnapshot()
    const localSnapshot = readLocalDb()

    if (!remoteSnapshot) {
      await pushLocalDbToGitHub(localSnapshot)
      const publishedDb = normalizeDatabasePayload(localSnapshot, localSnapshot)
      replaceLocalDb(publishedDb)

      emitStatus({
        isReady: true,
        inFlight: false,
        lastSyncAt: nowIso(),
        info: 'Base online criada no GitHub e sincronizada com sucesso.',
      })

      remoteUnavailable = false
      return publishedDb
    }

    const remoteDb = remoteSnapshot.db || {}

    if (!hasOperationalRecords(remoteDb) && hasOperationalRecords(localSnapshot)) {
      await pushLocalDbToGitHub(localSnapshot)
      const publishedDb = normalizeDatabasePayload(localSnapshot, localSnapshot)
      replaceLocalDb(publishedDb)

      emitStatus({
        isReady: true,
        inFlight: false,
        lastSyncAt: nowIso(),
        info: 'Base online do GitHub estava vazia e recebeu a base local atual.',
      })

      remoteUnavailable = false
      return publishedDb
    }

    const nextDb = normalizeDatabasePayload(remoteDb, localSnapshot)
    replaceLocalDb(nextDb)

    emitStatus({
      isReady: true,
      inFlight: false,
      lastSyncAt: nowIso(),
      info: silent
        ? 'Sincronizacao automatica com GitHub ativa.'
        : 'Base local sincronizada a partir do GitHub.',
    })

    remoteUnavailable = false
    return nextDb
  } catch (error) {
    const normalizedError = normalizeGitHubError(error)

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

export async function pushLocalDbToGitHub(db = readLocalDb()) {
  if (!isConfigured()) {
    throw new Error('GitHub nao configurado. Defina owner, repo, branch, filePath e token.')
  }

  emitStatus({
    inFlight: true,
    lastError: '',
    info: 'Enviando atualizacoes para a base online do GitHub...',
  })

  try {
    await upsertRemoteDb(db)

    remoteUnavailable = false
    emitStatus({
      isReady: true,
      inFlight: false,
      lastSyncAt: nowIso(),
      info: 'Base online atualizada com sucesso no GitHub.',
    })
  } catch (error) {
    const normalizedError = normalizeGitHubError(error)

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
        await pushLocalDbToGitHub(snapshot)
      } catch {
        pendingDb = pendingDb || snapshot
        break
      }
    }
  } finally {
    syncInFlight = false
  }
}

export function scheduleGitHubSync(db) {
  if (!isConfigured()) {
    emitStatus({
      isReady: false,
      lastError: '',
      info: 'GitHub nao configurado. Defina owner, repo, branch, filePath e token.',
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

export async function syncGitHubNow(db = readLocalDb()) {
  if (!isConfigured()) {
    throw new Error('GitHub nao configurado. Defina owner, repo, branch, filePath e token.')
  }

  remoteUnavailable = false
  pendingDb = db
  await flushSyncQueue()
  return readLocalDb()
}

export async function bootstrapGitHubDb() {
  if (!isConfigured()) {
    emitStatus({
      isReady: false,
      info: 'Modo GitHub ativo, mas a base compartilhada nao foi configurada.',
    })
    return readLocalDb()
  }

  if (!bootstrapPromise) {
    bootstrapPromise = pullGitHubDb({ silent: false }).catch((error) => {
      bootstrapPromise = null
      throw error
    })
  }

  return bootstrapPromise
}

export async function ensureGitHubDbLoaded() {
  if (!isConfigured()) {
    return readLocalDb()
  }

  const localSnapshot = readLocalDb()
  if (localSnapshot?.meta?.importedAt && hasOperationalRecords(localSnapshot)) {
    return localSnapshot
  }

  try {
    return await bootstrapGitHubDb()
  } catch {
    return readLocalDb()
  }
}

export function startGitHubAutoSync(intervalMs = 12000) {
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
      await pullGitHubDb({ silent: true })
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
