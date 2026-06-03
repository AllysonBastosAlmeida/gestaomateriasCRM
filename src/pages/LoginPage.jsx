import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, ShieldCheck } from 'lucide-react'
import { LoginForm } from '../components/auth/LoginForm'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { ROUTES } from '../utils/constants'
import { env } from '../utils/env'
import { ensureCrudCrudDbLoaded } from '../services/crudCrudSync'

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_22%),linear-gradient(180deg,#07101d_0%,#0a1324_55%,#060c17_100%)]">
      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
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

                  if (env.storageMode === 'crudcrud') {
                    await ensureCrudCrudDbLoaded()
                  }

                  login(username, password)
                  refreshSession()
                  toast.success(
                    env.storageMode === 'crudcrud'
                      ? 'Sessao iniciada e base online carregada com sucesso.'
                      : 'Sessao iniciada com sucesso.',
                  )

                  navigate(location.state?.from || ROUTES.dashboard, { replace: true })
                } catch (error) {
                  toast.error(error.message)
                } finally {
                  setLoading(false)
                }
              }}
            />
          </div>

          <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Usuarios seed</p>
            <div className="mt-2.5 space-y-2">
              {['admin / admin123', 'operador1 / 123456', 'operador2 / 123456'].map((credential) => (
                <div key={credential} className="flex items-center gap-2 text-[13px]">
                  <ChevronRight className="h-4 w-4 text-cyan-300" />
                  <span>{credential}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
