import {
  ArchiveX,
  ArrowLeftRight,
  Boxes,
  Building2,
  ClipboardList,
  LayoutDashboard,
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

export function MobileNav() {
  const { currentUser } = useAuth()

  return (
    <nav className="overflow-x-auto rounded-[24px] border border-white/10 bg-white/5 p-3">
      <div className="flex min-w-max gap-2">
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
                  'inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition',
                  isActive ? 'bg-cyan-400/15 text-white' : 'bg-white/5 text-slate-300',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            )
          })}
      </div>
    </nav>
  )
}
