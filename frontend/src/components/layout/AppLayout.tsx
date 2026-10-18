import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
import { MobileTopBar } from '@/components/layout/MobileTopBar'

export function AppLayout() {
  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-24 md:pb-0">
        <MobileTopBar />
        <Outlet />
      </main>
      <MobileTabBar />
    </div>
  )
}
