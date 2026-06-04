import { createSeedDatabase } from '../data/seed'
import { env } from '../utils/env'
import { nowIso } from '../utils/date'
import { MAX_STORED_MOVEMENTS, STORAGE_MODES } from '../utils/constants'

function clone(data) {
  return typeof structuredClone === 'function'
    ? structuredClone(data)
    : JSON.parse(JSON.stringify(data))
}

function createSharePointBootstrapDatabase() {
  const seedDb = createSeedDatabase()

  return {
    ...seedDb,
    clients: [],
    units: [],
    inventoryItems: [],
    inventoryDeletionRequests: [],
    stockMovements: [],
    auditLogs: [],
    deletionMarks: {
      units: [],
      inventoryItems: [],
      inventoryDeletionRequests: [],
      stockMovements: [],
      auditLogs: [],
    },
    settings: {
      ...(seedDb.settings || {}),
      storageMode: env.storageMode,
      theme: 'workspace-dark',
    },
    meta: {
      ...(seedDb.meta || {}),
      initializedAt: nowIso(),
      lastUpdatedAt: nowIso(),
      importedAt: '',
    },
  }
}

function createInitialDatabase() {
  return [STORAGE_MODES.crudcrud, STORAGE_MODES.github].includes(env.storageMode)
    ? createSharePointBootstrapDatabase()
    : createSeedDatabase()
}

function mergeSeedDatabase(currentDb) {
  if ([STORAGE_MODES.crudcrud, STORAGE_MODES.github].includes(env.storageMode)) {
    const nextDb = clone(currentDb)
    let changed = false

    for (const collection of ['users', 'clients', 'units', 'inventoryItems', 'inventoryDeletionRequests', 'stockMovements', 'auditLogs']) {
      if (!Array.isArray(nextDb[collection])) {
        nextDb[collection] = []
        changed = true
      }
    }

    if (!nextDb.deletionMarks || typeof nextDb.deletionMarks !== 'object') {
      nextDb.deletionMarks = {
        units: [],
        inventoryItems: [],
        inventoryDeletionRequests: [],
        stockMovements: [],
        auditLogs: [],
      }
      changed = true
    } else {
      for (const collection of ['units', 'inventoryItems', 'inventoryDeletionRequests', 'stockMovements', 'auditLogs']) {
        if (!Array.isArray(nextDb.deletionMarks[collection])) {
          nextDb.deletionMarks[collection] = []
          changed = true
        }
      }
    }

    if (!nextDb.meta) {
      nextDb.meta = {
        version: 1,
        initializedAt: nowIso(),
        lastUpdatedAt: nowIso(),
        importedAt: '',
      }
      changed = true
    }

    if (!nextDb.settings) {
      nextDb.settings = {
        storageMode: env.storageMode,
        theme: 'workspace-dark',
      }
      changed = true
    }

    return changed ? nextDb : currentDb
  }

  const seedDb = createSeedDatabase()
  const nextDb = clone(currentDb)
  let changed = false

  for (const collection of ['users', 'clients', 'units', 'inventoryItems', 'inventoryDeletionRequests', 'stockMovements', 'auditLogs']) {
    const currentRecords = nextDb[collection] || []
    const existingIds = new Set(currentRecords.map((record) => record.id))
    const missingRecords = (seedDb[collection] || []).filter((record) => !existingIds.has(record.id))

    if (missingRecords.length) {
      nextDb[collection] = [...currentRecords, ...clone(missingRecords)]
      changed = true
    }
  }

  if (!nextDb.settings) {
    nextDb.settings = clone(seedDb.settings)
    changed = true
  }

  const currentVersion = Number(nextDb.meta?.version || 1)
  const seedVersion = Number(seedDb.meta?.version || 1)

  if (currentVersion < seedVersion) {
    nextDb.meta = {
      ...seedDb.meta,
      ...(nextDb.meta || {}),
      version: seedVersion,
    }
    changed = true
  }

  return changed ? nextDb : currentDb
}

function trimPersistentCollections(db) {
  const nextDb = clone(db)

  if (Array.isArray(nextDb.stockMovements) && nextDb.stockMovements.length > MAX_STORED_MOVEMENTS) {
    nextDb.stockMovements = nextDb.stockMovements
      .slice()
      .sort((left, right) => String(left.performedAt || '').localeCompare(String(right.performedAt || '')))
      .slice(-MAX_STORED_MOVEMENTS)
  }

  return nextDb
}

function writeDb(db) {
  const trimmedDb = trimPersistentCollections(db)
  const payload = {
    ...trimmedDb,
    meta: {
      ...(trimmedDb.meta || {}),
      lastUpdatedAt: nowIso(),
    },
  }

  localStorage.setItem(env.localDbKey, JSON.stringify(payload))
  return payload
}

export function ensureLocalDb() {
  const current = localStorage.getItem(env.localDbKey)
  if (!current) {
    writeDb(createInitialDatabase())
    return
  }

  try {
    const parsed = JSON.parse(current)
    const merged = mergeSeedDatabase(parsed)
    if (merged !== parsed) {
      writeDb(merged)
    }
  } catch {
    writeDb(createInitialDatabase())
  }
}

export function readLocalDb() {
  ensureLocalDb()

  try {
    return JSON.parse(localStorage.getItem(env.localDbKey))
  } catch {
    const freshDb = createInitialDatabase()
    return writeDb(freshDb)
  }
}

export function resetLocalDb() {
  return writeDb(createInitialDatabase())
}

export function replaceLocalDb(nextDb) {
  return writeDb(nextDb)
}

export function listRecords(collection) {
  return clone(readLocalDb()[collection] || [])
}

export function getRecord(collection, id) {
  return listRecords(collection).find((item) => item.id === id) || null
}

export function insertRecord(collection, record) {
  const db = readLocalDb()
  db[collection] = [...(db[collection] || []), clone(record)]
  writeDb(db)
  return record
}

export function updateRecord(collection, id, updater) {
  const db = readLocalDb()
  const records = db[collection] || []
  const index = records.findIndex((item) => item.id === id)

  if (index === -1) {
    throw new Error(`Registro nao encontrado em ${collection}.`)
  }

  const previousRecord = records[index]
  const nextRecord = typeof updater === 'function'
    ? updater(clone(previousRecord))
    : { ...previousRecord, ...updater }

  records[index] = nextRecord
  db[collection] = records
  writeDb(db)
  return clone(nextRecord)
}

export function runTransaction(mutator) {
  const db = clone(readLocalDb())
  const result = mutator(db)
  writeDb(db)
  return result
}
