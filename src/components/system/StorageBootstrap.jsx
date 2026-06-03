import { useEffect } from 'react'
import { env } from '../../utils/env'
import { bootstrapCrudCrudDb, startCrudCrudAutoSync } from '../../services/crudCrudSync'

export function StorageBootstrap() {
  useEffect(() => {
    if (env.storageMode === 'crudcrud') {
      void bootstrapCrudCrudDb().catch(() => {})
      return startCrudCrudAutoSync()
    }

    return undefined
  }, [])

  return null
}
