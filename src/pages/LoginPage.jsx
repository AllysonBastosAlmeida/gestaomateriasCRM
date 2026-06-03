import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { LoginForm } from '../components/auth/LoginForm'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { ROUTES } from '../utils/constants'
import { env } from '../utils/env'
import { ensureCrudCrudDbLoaded, getCrudCrudSyncStatus } from '../services/crudCrudSync'
import { ensureGitHubDbLoaded, getGitHubSyncStatus } from '../services/githubSync'

export function LoginPage() {
  const { currentUser, login, refreshSession } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)

  if (currentUser) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return (
    <div className="login-stage min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="login-orb login-orb-a" />
        <div className="login-orb login-orb-b" />
        <div className="login-orb login-orb-c" />
        <div className="login-grid" />
        <span className="login-particle login-particle-a" />
        <span className="login-particle login-particle-b" />
        <span className="login-particle login-particle-c" />
        <span className="login-particle login-particle-d" />
        <span className="login-particle login-particle-e" />
      </div>

      <section className="relative z-[1] flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-slate-950/78 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-cyan-400/10 p-2.5">
              <ShieldCheck className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Acesso local</p>
              <h2 className="mt-1 font-display text-xl font-bold text-white">Entrar</h2>
              <p className="mt-1 text-sm text-slate-400">Login por usuario com permissoes administrativas e operacionais.</p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <LoginForm
              loading={loading}
              onSubmit={async ({ username, password }) => {
                try {
                  setLoading(true)

                  if (env.storageMode === 'github') {
                    await ensureGitHubDbLoaded()
                  }

                  if (env.storageMode === 'crudcrud') {
                    await ensureCrudCrudDbLoaded()
                  }

                  login(username, password)
                  refreshSession()
                  const remoteStatus = env.storageMode === 'github'
                    ? getGitHubSyncStatus()
                    : env.storageMode === 'crudcrud'
                      ? getCrudCrudSyncStatus()
                      : null

                  if (remoteStatus && !remoteStatus.isReady) {
                    toast.info('Sessao iniciada em modo local. A base online esta indisponivel no momento.')
                  } else {
                    toast.success(
                      env.storageMode === 'github' || env.storageMode === 'crudcrud'
                        ? 'Sessao iniciada e base online carregada com sucesso.'
                        : 'Sessao iniciada com sucesso.',
                    )
                  }

                  navigate(location.state?.from || ROUTES.dashboard, { replace: true })
                } catch (error) {
                  toast.error(error.message)
                } finally {
                  setLoading(false)
                }
              }}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
