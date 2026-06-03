import { Menu, ShieldCheck } from 'lucide-react'
import { Breadcrumbs } from './Breadcrumbs'
import { useAuth } from '../../hooks/useAuth'

const pathLabels = {
  '/': 'Clientes',
  '/clientes': 'Cadastro',
  '/estoque': 'Estoque',
  '/exclusoes': 'Exclusoes',
  '/movimentacoes': 'Logs',
  '/auditoria': 'Auditoria',
  '/usuarios': 'Usuarios',
  '/configuracoes': 'Configuracoes',
}

export function Header({ pathname }) {
  const { currentUser } = useAuth()
  const title = pathLabels[pathname] || 'Detalhe operacional'

  return (
    <header className="border-b border-white/10 bg-slate-950/50 backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="rounded-2xl bg-white/5 p-2">
              <Menu className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-lg font-extrabold text-white">{title}</span>
          </div>
          <div className="hidden lg:block">
            <Breadcrumbs pathname={pathname} />
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
            <div className="rounded-2xl bg-cyan-400/10 p-2">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{currentUser.name}</p>
              <p className="text-xs text-slate-400">Sessao local protegida</p>
            </div>
          </div>
        </div>
        <div className="lg:hidden">
          <Breadcrumbs pathname={pathname} />
        </div>
      </div>
    </header>
  )
}
