import type { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileTabBar } from '@/components/layout/MobileTabBar'

interface AppLayoutProps {
  active: string
  onNavigate: (id: string) => void
  children: ReactNode
}

export function AppLayout({ active, onNavigate, children }: AppLayoutProps) {
  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar active={active} onNavigate={onNavigate} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <MobileTabBar active={active} onNavigate={onNavigate} />
    </div>
  )
}
