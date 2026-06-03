import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'

export function AppLayout() {
  const location = useLocation()
  const isClientPicker = location.pathname === '/'
  const isClientWorkspace = /^\/clientes\/[^/]+$/.test(location.pathname)
  const isMinimalShell = isClientPicker || isClientWorkspace

  if (isMinimalShell) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.10),transparent_22%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_24%),linear-gradient(180deg,#08111f_0%,#0b1324_48%,#050b16_100%)]">
        <main className="mx-auto min-h-screen max-w-[1560px] px-4 py-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_26%),linear-gradient(180deg,#08111f_0%,#0b1324_48%,#050b16_100%)]">
      <div className="mx-auto flex min-h-screen max-w-[1480px]">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Header pathname={location.pathname} />
          <div className="px-4 pt-4 sm:px-6 lg:hidden">
            <MobileNav />
          </div>
          <main className="flex-1 px-4 pb-8 pt-4 sm:px-6 lg:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
