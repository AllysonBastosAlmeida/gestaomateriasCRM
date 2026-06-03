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
  bootstrapGitHubDb,
  getGitHubSyncStatus,
  pullGitHubDb,
  scheduleGitHubSync,
  startGitHubAutoSync,
  subscribeGitHubSync,
  syncGitHubNow,
} from './githubSync'

export const githubAdapter = {
  mode: 'github',
  label: 'GitHub compartilhado',
  get isFallback() {
    return !getGitHubSyncStatus().isReady
  },
  get isReady() {
    return getGitHubSyncStatus().isReady
  },
  get info() {
    return getGitHubSyncStatus().info
  },
  readDb: readLocalDb,
  replaceDb(nextDb) {
    const result = replaceLocalDb(nextDb)
    scheduleGitHubSync(readLocalDb())
    return result
  },
  list: listRecords,
  get: getRecord,
  insert(collection, record) {
    const result = insertRecord(collection, record)
    scheduleGitHubSync(readLocalDb())
    return result
  },
  update(collection, id, updater) {
    const result = updateRecord(collection, id, updater)
    scheduleGitHubSync(readLocalDb())
    return result
  },
  transaction(mutator) {
    const result = runTransaction(mutator)
    scheduleGitHubSync(readLocalDb())
    return result
  },
  bootstrap: bootstrapGitHubDb,
  pushRemote: syncGitHubNow,
  pullRemote: pullGitHubDb,
  subscribe: subscribeGitHubSync,
  getStatus: getGitHubSyncStatus,
  startAutoSync: startGitHubAutoSync,
}
