import { Link } from 'react-router-dom'
import { CircleChip } from '@/components/circles/CircleChip'
import { PlusIcon } from '@/components/icons'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { PageSection } from '@/components/ui/PageSection'
import type { ReconnectItem } from '@/lib/api/types'
import { CardHint, ContactLink, ViewAllLink } from './card-parts'

interface ReachOutCardProps {
  items: ReconnectItem[]
  /** Every contact due, not just the rows shown. */
  totalDue: number
  className?: string
  onLog: (contactId: number) => void
}

function overdueLabel(days: number): string {
  if (days <= 0) return 'due today'
  return `${days} day${days === 1 ? '' : 's'} overdue`
}

/** Contacts whose keep-in-touch cadence has come due, most overdue first. */
export function ReachOutCard({ items, totalDue, className = '', onLog }: ReachOutCardProps) {
  const description =
    totalDue > items.length
      ? `Showing ${items.length} of ${totalDue} due for a catch-up`
      : 'People whose keep-in-touch cadence has come due'

  return (
    <PageSection
      title="Reach out"
      description={description}
      actions={totalDue > 0 ? <ViewAllLink to="/reminders">See all</ViewAllLink> : undefined}
      className={className}
    >
      {items.length === 0 ? (
        <CardHint>
          Nobody is due right now. Give a contact a keep-in-touch cadence on the{' '}
          <Link to="/contacts" className="font-medium text-brand-600 hover:underline">
            Contacts
          </Link>{' '}
          page and orbit will nudge you here.
        </CardHint>
      ) : (
        <ul className="-my-1 divide-y divide-border-hairline">
          {items.map((item) => (
            <li key={item.contact_id} className="flex items-center gap-3 py-3">
              <Avatar name={item.name} size={36} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <ContactLink id={item.contact_id} name={item.name} />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <CircleChip circle={item.circle} />
                  <span
                    className={
                      item.days_overdue > 0 ? 'font-medium text-badge-error-fg' : 'font-medium text-brand-600'
                    }
                  >
                    {overdueLabel(item.days_overdue)}
                  </span>
                </div>
              </div>
              <Button
                variant="secondary"
                icon={<PlusIcon width={14} height={14} />}
                onClick={() => onLog(item.contact_id)}
                aria-label={`Log interaction with ${item.name}`}
              >
                <span className="sm:hidden">Log</span>
                <span className="hidden sm:inline">Log interaction</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </PageSection>
  )
}
