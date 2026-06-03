import {
  getRecord,
  insertRecord,
  listRecords,
  readLocalDb,
  replaceLocalDb,
  runTransaction,
  updateRecord,
} from './localDb'
import {
  bootstrapCrudCrudDb,
  getCrudCrudSyncStatus,
  pullCrudCrudDb,
  scheduleCrudCrudSync,
  startCrudCrudAutoSync,
  subscribeCrudCrudSync,
  syncCrudCrudNow,
} from './crudCrudSync'

export const crudCrudAdapter = {
  mode: 'crudcrud',
  label: 'CrudCrud compartilhado',
  get isFallback() {
    return !getCrudCrudSyncStatus().isReady
  },
  get isReady() {
    return getCrudCrudSyncStatus().isReady
  },
  get info() {
    return getCrudCrudSyncStatus().info
  },
  readDb: readLocalDb,
  replaceDb(nextDb) {
    const result = replaceLocalDb(nextDb)
    scheduleCrudCrudSync(readLocalDb())
    return result
  },
  list: listRecords,
  get: getRecord,
  insert(collection, record) {
    const result = insertRecord(collection, record)
    scheduleCrudCrudSync(readLocalDb())
    return result
  },
  update(collection, id, updater) {
    const result = updateRecord(collection, id, updater)
    scheduleCrudCrudSync(readLocalDb())
    return result
  },
  transaction(mutator) {
    const result = runTransaction(mutator)
    scheduleCrudCrudSync(readLocalDb())
    return result
  },
  bootstrap: bootstrapCrudCrudDb,
  pushRemote: syncCrudCrudNow,
  pullRemote: pullCrudCrudDb,
  subscribe: subscribeCrudCrudSync,
  getStatus: getCrudCrudSyncStatus,
  startAutoSync: startCrudCrudAutoSync,
}
