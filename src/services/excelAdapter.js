import {
  getRecord,
  insertRecord,
  listRecords,
  readLocalDb,
  replaceLocalDb,
  runTransaction,
  updateRecord,
} from './localDb'

export const excelAdapter = {
  mode: 'excel',
  label: 'Excel local',
  isFallback: true,
  isReady: false,
  info: 'Adapter preparado. No MVP, as operacoes continuam usando persistencia local.',
  readDb: readLocalDb,
  replaceDb: replaceLocalDb,
  list: listRecords,
  get: getRecord,
  insert: insertRecord,
  update: updateRecord,
  transaction: runTransaction,
}
