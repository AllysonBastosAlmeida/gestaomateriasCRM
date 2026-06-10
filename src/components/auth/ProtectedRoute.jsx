import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../utils/constants'

export function ProtectedRoute({ roles = [], children }) {
  const { currentUser, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="rounded-[24px] border border-white/10 bg-slate-950/60 px-6 py-4 text-sm text-slate-300">
          Restaurando sessao...
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
  }

  if (roles.length > 0 && !roles.includes(currentUser.role)) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return children || <Outlet />
}
