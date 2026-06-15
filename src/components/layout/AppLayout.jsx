import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { useAuth } from '../../hooks/useAuth'
import { SyncStatusPill } from '../system/SyncStatusPill'

export function AppLayout() {
  const location = useLocation()
  const { currentUser } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const isClientPicker = location.pathname === '/'
  const isClientWorkspace = /^\/clientes\/[^/]+$/.test(location.pathname)
  const isMinimalShell = isClientPicker || isClientWorkspace
  const minimalShellSyncStatus = (
    <div className="fixed right-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-[60] sm:right-4">
      <SyncStatusPill />
    </div>
  )

  if (isMinimalShell) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.10),transparent_22%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_24%),linear-gradient(180deg,#08111f_0%,#0b1324_48%,#050b16_100%)]">
        {minimalShellSyncStatus}
        <main className="mx-auto min-h-screen max-w-[1560px] px-4 py-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_26%),linear-gradient(180deg,#08111f_0%,#0b1324_48%,#050b16_100%)]">
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm lg:hidden" onClick={() => setMobileNavOpen(false)} />
      ) : null}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[320px] border-r border-cyan-400/10 bg-[linear-gradient(180deg,rgba(6,11,27,0.99)_0%,rgba(9,18,39,0.99)_52%,rgba(7,13,30,1)_100%)] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)] transition-transform duration-200 lg:hidden',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-3 shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
            Workspace
          </p>
          <h1 className="mt-1 font-display text-lg font-extrabold text-white">
            Gestao de Materiais CRM
          </h1>
          <p className="mt-1 text-[12px] text-slate-400">
            {currentUser.name}
          </p>
        </div>
        <div className="mt-3">
          <MobileNav layout="column" onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </aside>
      <div className="mx-auto flex min-h-screen max-w-[1480px]">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Header pathname={location.pathname} onOpenMobileNav={() => setMobileNavOpen(true)} />
          <main className="flex-1 px-4 pb-8 pt-4 sm:px-6 lg:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
