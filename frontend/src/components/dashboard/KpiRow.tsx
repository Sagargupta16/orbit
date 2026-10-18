import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ActivityIcon, BellIcon, RefreshIcon, UsersIcon } from '@/components/icons'
import { Badge } from '@/components/ui/StatusBadge'
import type { Dashboard } from '@/lib/api/types'

interface KpiTileProps {
  to: string
  label: string
  value: number
  icon: ReactNode
  note?: ReactNode
}

function KpiTile({ to, label, value, icon, note }: KpiTileProps) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-3 rounded-card bg-surface p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
    >
      <span className="inline-flex size-9 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
        {icon}
      </span>
      <div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-2xl font-semibold tracking-tight text-text-primary tabular-nums">{value}</span>
          {note}
        </div>
        <p className="mt-0.5 text-xs leading-snug text-text-secondary sm:text-sm">{label}</p>
      </div>
    </Link>
  )
}

/** Four headline numbers; two columns on phones, four from 1024px. */
export function KpiRow({ totals }: { totals: Dashboard['totals'] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <KpiTile to="/contacts" label="Contacts" value={totals.contacts} icon={<UsersIcon width={18} height={18} />} />
      <KpiTile
        to="/interactions"
        label="Interactions (30 days)"
        value={totals.interactions_30d}
        icon={<ActivityIcon width={18} height={18} />}
      />
      <KpiTile
        to="/reminders"
        label="Open reminders"
        value={totals.open_reminders}
        icon={<BellIcon width={18} height={18} />}
        note={
          totals.overdue_reminders > 0 ? (
            <Badge variant="error">{`${totals.overdue_reminders} overdue`}</Badge>
          ) : null
        }
      />
      <KpiTile
        to="/reminders"
        label="Due to reconnect"
        value={totals.reconnect_due}
        icon={<RefreshIcon width={18} height={18} />}
      />
    </div>
  )
}
