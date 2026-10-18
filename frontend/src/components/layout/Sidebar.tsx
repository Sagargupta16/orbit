import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { primaryNav } from '@/components/layout/nav'
import { Avatar } from '@/components/ui/Avatar'
import { MoonIcon, SunIcon } from '@/components/icons'
import { getStoredTheme, toggleTheme, type Theme } from '@/lib/theme'
import { useAuth } from '@/lib/auth/useAuth'

export function Sidebar() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())
  const { user, logout } = useAuth()
  const displayName = user?.full_name ?? user?.email ?? 'Account'

  return (
    <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col border-r border-border-hairline bg-surface md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex size-7 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
          o
        </span>
        <span className="text-lg font-semibold tracking-tight text-text-primary">orbit</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {primaryNav.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-active text-sidebar-active-fg'
                    : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                }`
              }
            >
              <Icon width={18} height={18} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-border-hairline p-3">
        <button
          type="button"
          onClick={() => setTheme(toggleTheme())}
          className="mb-2 flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
        >
          {theme === 'dark' ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <div className="flex items-center gap-3 rounded-control px-3 py-2">
          <Avatar name={displayName} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">{displayName}</p>
            <button
              type="button"
              onClick={() => void logout()}
              className="text-xs text-text-secondary transition-colors hover:text-text-primary"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
