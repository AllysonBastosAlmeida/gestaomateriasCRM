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

export function MobileNav({ layout = 'row', onNavigate }) {
  const { currentUser, logout } = useAuth()
  const isColumn = layout === 'column'
  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(currentUser.role))

  return (
    <nav className={isColumn ? 'space-y-2' : 'overflow-x-auto rounded-[18px] border border-white/10 bg-white/5 p-2'}>
      <div className={isColumn ? 'space-y-1.5' : 'flex min-w-max gap-2'}>
        {items.map((item) => {
          const Icon = iconMap[item.icon]
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onNavigate}
              className={({ isActive }) => [
                isColumn
                  ? 'flex items-center gap-3 rounded-2xl px-3 py-2 text-[13px] font-semibold transition'
                  : 'inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap transition',
                isActive ? 'bg-cyan-400/15 text-white' : 'bg-white/5 text-slate-300',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}
        {isColumn ? (
          <button
            type="button"
            onClick={() => {
              onNavigate?.()
              logout()
            }}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/10 px-3 py-2 text-[13px] font-semibold text-slate-300"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        ) : null}
      </div>
    </nav>
  )
}
