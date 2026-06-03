import {
  ArchiveX,
  ArrowLeftRight,
  Boxes,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../../utils/constants'
import { useAuth } from '../../hooks/useAuth'

const iconMap = {
  LayoutDashboard,
  Building2,
  Boxes,
  ArchiveX,
  ArrowLeftRight,
  ClipboardList,
  Users,
  Settings,
}

export function Sidebar() {
  const { currentUser, logout } = useAuth()

  return (
    <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-white/10 bg-slate-950/55 px-4 py-5 backdrop-blur lg:flex">
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">
          Workspace cliente
        </p>
        <h1 className="mt-2 font-display text-xl font-extrabold text-white">
          Gestao de Materiais CRM
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Estoque distribuido, acesso por cliente e operacao local.
        </p>
      </div>

      <nav className="mt-5 flex-1 space-y-2">
        {NAV_ITEMS
          .filter((item) => !item.roles || item.roles.includes(currentUser.role))
          .map((item) => {
            const Icon = iconMap[item.icon]
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => [
                  'flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition',
                  isActive
                    ? 'bg-cyan-400/15 text-white shadow-[0_12px_30px_rgba(34,211,238,0.12)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            )
          })}
      </nav>

      <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
        <p className="text-sm font-semibold text-white">{currentUser.name}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{currentUser.role}</p>
        <button
          type="button"
          onClick={logout}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
