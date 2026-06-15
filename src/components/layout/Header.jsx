import { Menu, ShieldCheck } from 'lucide-react'
import { Breadcrumbs } from './Breadcrumbs'
import { useAuth } from '../../hooks/useAuth'
import { SyncStatusPill } from '../system/SyncStatusPill'

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

export function Header({ pathname, onOpenMobileNav }) {
  const { currentUser } = useAuth()
  const title = pathLabels[pathname] || 'Detalhe operacional'

  return (
    <header className="border-b border-white/10 bg-slate-950/50 backdrop-blur">
      <div className="flex flex-col gap-2 px-4 py-3 sm:gap-3 sm:px-6 lg:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={onOpenMobileNav}
              className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5 text-white" />
            </button>
            <span className="font-display text-base font-extrabold text-white sm:text-lg">{title}</span>
          </div>
          <div className="hidden lg:block">
            <Breadcrumbs pathname={pathname} />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <SyncStatusPill />
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 sm:gap-3 sm:px-4 sm:py-2">
              <div className="rounded-2xl bg-cyan-400/10 p-1.5 sm:p-2">
                <ShieldCheck className="h-4 w-4 text-cyan-300" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-white sm:text-sm">{currentUser.name}</p>
                <p className="hidden text-xs text-slate-400 sm:block">Sessao local protegida</p>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden lg:hidden">
          <Breadcrumbs pathname={pathname} />
        </div>
      </div>
    </header>
  )
}
