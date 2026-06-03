import { createContext, useEffect, useMemo, useState } from 'react'
import { getCurrentUser, login as loginService, logout as logoutService } from '../services/auth'
import { ensureCrudCrudDbLoaded } from '../services/crudCrudSync'
import { ensureGitHubDbLoaded } from '../services/githubSync'
import { env } from '../utils/env'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    let cancelled = false

    const restoreSession = async () => {
      if (env.storageMode === 'github') {
        try {
          await ensureGitHubDbLoaded()
        } catch {
          // keep login page usable; remote sync can retry on submit
        }
      }

      if (env.storageMode === 'crudcrud') {
        try {
          await ensureCrudCrudDbLoaded()
        } catch {
          // keep login page usable; remote sync can retry on submit
        }
      }

      if (!cancelled) {
        setCurrentUser(getCurrentUser())
      }
    }

    void restoreSession()

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(() => ({
    currentUser,
    isAuthenticated: Boolean(currentUser),
    login(username, password) {
      const user = loginService(username, password)
      setCurrentUser(user)
      return user
    },
    logout() {
      logoutService(currentUser)
      setCurrentUser(null)
    },
    refreshSession() {
      setCurrentUser(getCurrentUser())
    },
  }), [currentUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
