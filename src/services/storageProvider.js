import {
  getRecord,
  insertRecord,
  listRecords,
  readLocalDb,
  replaceLocalDb,
  runTransaction,
  updateRecord,
} from './localDb'
import { crudCrudAdapter } from './crudCrudAdapter'
import { excelAdapter } from './excelAdapter'
import { env } from '../utils/env'
import { STORAGE_MODES } from '../utils/constants'

const localAdapter = {
  mode: STORAGE_MODES.local,
  label: 'Banco local',
  isFallback: false,
  isReady: true,
  info: 'Persistencia completa em localStorage.',
  readDb: readLocalDb,
  replaceDb: replaceLocalDb,
  list: listRecords,
  get: getRecord,
  insert: insertRecord,
  update: updateRecord,
  transaction: runTransaction,
}

export function getStorageProvider() {
  switch (env.storageMode) {
    case STORAGE_MODES.excel:
      return excelAdapter
    case STORAGE_MODES.crudcrud:
      return crudCrudAdapter
    default:
      return localAdapter
  }
}
