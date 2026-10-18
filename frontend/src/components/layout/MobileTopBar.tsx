import { useEffect, useRef, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { LogoutIcon, MoonIcon, SunIcon } from '@/components/icons'
import { getStoredTheme, toggleTheme, type Theme } from '@/lib/theme'
import { useAuth } from '@/lib/auth/useAuth'

/** Phone-only header: brand plus an account menu with theme toggle and sign out. */
export function MobileTopBar() {
  const { user, logout } = useAuth()
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const displayName = user?.full_name ?? user?.email ?? 'Account'

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border-hairline bg-surface px-4 pt-[env(safe-area-inset-top)] md:hidden">
      <div className="flex h-14 items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
          o
        </span>
        <span className="text-base font-semibold tracking-tight text-text-primary">orbit</span>
      </div>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Account menu"
          aria-expanded={open}
          className="inline-flex size-10 items-center justify-center rounded-full"
        >
          <Avatar name={displayName} size={32} />
        </button>
        {open ? (
          <div className="absolute right-0 top-12 w-56 animate-toast-in rounded-card border border-border-hairline bg-surface p-1.5 shadow-lg">
            <p className="truncate px-3 py-2 text-xs text-text-secondary">{user?.email ?? displayName}</p>
            <button
              type="button"
              onClick={() => setTheme(toggleTheme())}
              className="flex h-10 w-full items-center gap-3 rounded-control px-3 text-sm font-medium text-text-primary hover:bg-surface-subtle"
            >
              {theme === 'dark' ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex h-10 w-full items-center gap-3 rounded-control px-3 text-sm font-medium text-badge-error-fg hover:bg-surface-subtle"
            >
              <LogoutIcon width={16} height={16} />
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
