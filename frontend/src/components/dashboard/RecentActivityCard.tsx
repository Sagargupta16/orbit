import { KIND_META } from '@/components/interactions/kinds'
import { PlusIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { PageSection } from '@/components/ui/PageSection'
import type { Interaction } from '@/lib/api/types'
import { formatDateTime, relativeTime } from '@/lib/format'
import { CardHint, ContactLink, ViewAllLink } from './card-parts'

interface RecentActivityCardProps {
  interactions: Interaction[]
  className?: string
  onLog: () => void
}

/** The five newest interactions with a quick way to log another. */
export function RecentActivityCard({ interactions, className = '', onLog }: RecentActivityCardProps) {
  return (
    <PageSection
      title="Recent activity"
      description="Your latest calls, messages and meetings"
      actions={
        <>
          <ViewAllLink to="/interactions">View all</ViewAllLink>
          <Button icon={<PlusIcon width={14} height={14} />} onClick={onLog}>
            Log interaction
          </Button>
        </>
      }
      className={className}
    >
      {interactions.length === 0 ? (
        <CardHint>No interactions yet. Log a call, email or meeting and your timeline starts here.</CardHint>
      ) : (
        <ul className="-my-1 divide-y divide-border-hairline">
          {interactions.map((i) => {
            const meta = KIND_META[i.kind]
            const Icon = meta.icon
            return (
              <li key={i.id} className="flex gap-3 py-3">
                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Icon width={16} height={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex min-w-0 items-center gap-1.5 text-sm">
                      <ContactLink id={i.contact_id} name={i.contact_name} />
                      <span className="shrink-0 text-xs text-text-secondary">{meta.label}</span>
                    </p>
                    <time
                      dateTime={i.occurred_at}
                      title={formatDateTime(i.occurred_at)}
                      className="shrink-0 text-xs whitespace-nowrap text-text-secondary"
                    >
                      {relativeTime(i.occurred_at)}
                    </time>
                  </div>
                  {i.notes ? <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{i.notes}</p> : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </PageSection>
  )
}
