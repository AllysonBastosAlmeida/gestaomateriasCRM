import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { StorageBootstrap } from './components/system/StorageBootstrap'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ClientsPage } from './pages/ClientsPage'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { UnitDetailPage } from './pages/UnitDetailPage'
import { InventoryPage } from './pages/InventoryPage'
import { DeletionRequestsPage } from './pages/DeletionRequestsPage'
import { MovementsPage } from './pages/MovementsPage'
import { AuditPage } from './pages/AuditPage'
import { UsersPage } from './pages/UsersPage'
import { SettingsPage } from './pages/SettingsPage'
import { ROUTES, ROLES } from './utils/constants'

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <StorageBootstrap />
        <Routes>
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path={ROUTES.dashboard} element={<DashboardPage />} />
              <Route path={ROUTES.clients} element={<ClientsPage />} />
              <Route path={ROUTES.clientDetail} element={<ClientDetailPage />} />
              <Route path={ROUTES.unitDetail} element={<UnitDetailPage />} />
              <Route path={ROUTES.inventory} element={<InventoryPage />} />
              <Route
                path={ROUTES.deletionRequests}
                element={(
                  <ProtectedRoute roles={[ROLES.admin]}>
                    <DeletionRequestsPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                path={ROUTES.movements}
                element={(
                  <ProtectedRoute roles={[ROLES.admin]}>
                    <MovementsPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                path={ROUTES.audit}
                element={(
                  <ProtectedRoute roles={[ROLES.admin]}>
                    <AuditPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                path={ROUTES.users}
                element={(
                  <ProtectedRoute roles={[ROLES.admin]}>
                    <UsersPage />
                  </ProtectedRoute>
                )}
              />
              <Route path={ROUTES.settings} element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  )
}
