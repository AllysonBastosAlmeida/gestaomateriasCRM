import { useEffect } from 'react'
import { env } from '../../utils/env'
import { bootstrapCrudCrudDb, startCrudCrudAutoSync } from '../../services/crudCrudSync'
import { bootstrapGitHubDb, startGitHubAutoSync } from '../../services/githubSync'

export function StorageBootstrap() {
  useEffect(() => {
    if (env.storageMode === 'github') {
      void bootstrapGitHubDb().catch(() => {})
      return startGitHubAutoSync()
    }

    if (env.storageMode === 'crudcrud') {
      void bootstrapCrudCrudDb().catch(() => {})
      return startCrudCrudAutoSync()
    }

    return undefined
  }, [])

  return null
}
