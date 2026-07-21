import { primaryNav } from '@/components/layout/nav'

interface MobileTabBarProps {
  active: string
  onNavigate: (id: string) => void
}

export function MobileTabBar({ active, onNavigate }: MobileTabBarProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-border-hairline bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      {primaryNav.map((item) => {
        const isActive = item.id === active
        const Icon = item.icon
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
              isActive ? 'text-brand-500' : 'text-text-secondary'
            }`}
          >
            <Icon width={20} height={20} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
