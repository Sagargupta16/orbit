import { Button } from '@/components/ui/Button'
import { SearchIcon, XIcon } from '@/components/icons'
import { CIRCLES, STATUSES, type Circle, type ContactStatus } from '@/lib/api/types'

const STATUS_LABEL: Record<ContactStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  pending: 'Pending',
}

const SELECT =
  'h-10 min-w-0 flex-1 rounded-control border border-border-hairline bg-surface pl-3 pr-8 text-base text-text-primary sm:text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:w-40 sm:flex-none'

interface ContactListToolbarProps {
  query: string
  onQueryChange: (value: string) => void
  circle: Circle | ''
  onCircleChange: (value: Circle | '') => void
  status: ContactStatus | ''
  onStatusChange: (value: ContactStatus | '') => void
  onClear: () => void
}

/** Search plus circle and status filters. Search fills the first row on phones; the selects share the next. */
export function ContactListToolbar({
  query,
  onQueryChange,
  circle,
  onCircleChange,
  status,
  onStatusChange,
  onClear,
}: ContactListToolbarProps) {
  const active = query.trim() !== '' || circle !== '' || status !== ''

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:max-w-sm sm:flex-1">
        <SearchIcon
          width={16}
          height={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-placeholder"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search name, email, company or notes"
          aria-label="Search contacts"
          autoComplete="off"
          className="h-10 w-full rounded-control border border-border-hairline bg-surface pl-9 pr-3 text-base text-text-primary sm:text-sm placeholder:text-text-placeholder focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>
      <select
        value={circle}
        onChange={(e) => onCircleChange(e.target.value as Circle | '')}
        aria-label="Filter by circle"
        className={SELECT}
      >
        <option value="">All circles</option>
        {CIRCLES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as ContactStatus | '')}
        aria-label="Filter by status"
        className={SELECT}
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      {active ? (
        <Button variant="ghost" icon={<XIcon width={16} height={16} />} onClick={onClear}>
          Clear filters
        </Button>
      ) : null}
    </div>
  )
}
