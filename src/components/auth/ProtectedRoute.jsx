import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../utils/constants'

export function ProtectedRoute({ roles = [], children }) {
  const { currentUser } = useAuth()
  const location = useLocation()

  if (!currentUser) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
  }

  if (roles.length > 0 && !roles.includes(currentUser.role)) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return children || <Outlet />
}
