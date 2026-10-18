import { NavLink } from 'react-router-dom'
import { primaryNav } from '@/components/layout/nav'

export function MobileTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-border-hairline bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      {primaryNav.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                isActive ? 'text-brand-600' : 'text-text-secondary'
              }`
            }
          >
            <Icon width={20} height={20} />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
