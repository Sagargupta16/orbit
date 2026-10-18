import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/StatusBadge'
import { CIRCLES, type Circle, type Contact } from '@/lib/api/types'
import { relativeTime } from '@/lib/format'
import { CIRCLE_META } from './meta'

const PREVIEW_COUNT = 6

const DESCRIPTIONS: Record<Circle, string> = {
  Family: 'The people closest to you',
  Friends: 'People you choose to keep close',
  Work: 'Colleagues, clients and collaborators',
  Network: 'Everyone else worth staying in touch with',
}

function isDue(contact: Contact, today: string): boolean {
  return contact.reconnect_due_on !== null && contact.reconnect_due_on <= today
}

interface CircleCardProps {
  circle: Circle
  /** Members already sorted for display. */
  members: Contact[]
  /** Local YYYY-MM-DD, compared against reconnect_due_on. */
  today: string
  movingId: number | null
  onMove: (contact: Contact, circle: Circle) => void
}

export function CircleCard({ circle, members, today, movingId, onMove }: CircleCardProps) {
  const [expanded, setExpanded] = useState(false)
  const meta = CIRCLE_META[circle]
  const withCadence = members.filter((m) => m.stay_in_touch_days !== null)
  const dueCount = withCadence.filter((m) => isDue(m, today)).length
  const shown = expanded ? members : members.slice(0, PREVIEW_COUNT)
  const targets = CIRCLES.filter((c) => c !== circle)

  return (
    <section className="flex flex-col rounded-card bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-text-primary">
            <span className={`size-2.5 shrink-0 rounded-full ${meta.dot}`} aria-hidden="true" />
            {circle}
          </h2>
          <p className="mt-0.5 text-xs text-text-secondary">{DESCRIPTIONS[circle]}</p>
        </div>
        <span className={`shrink-0 rounded-badge px-2.5 py-0.5 text-xs font-medium tabular-nums ${meta.chip}`}>
          {members.length} {members.length === 1 ? 'person' : 'people'}
        </span>
      </div>

      {members.length > 0 ? (
        <p className="mt-3 text-xs text-text-secondary">
          {withCadence.length === 0 ? (
            'No keep-in-touch cadences yet'
          ) : (
            <>
              {withCadence.length} on a keep-in-touch cadence,{' '}
              {dueCount > 0 ? (
                <span className="font-medium text-badge-error-fg">{dueCount} due now</span>
              ) : (
                'none due'
              )}
            </>
          )}
        </p>
      ) : null}

      {members.length === 0 ? (
        <p className="mt-4 rounded-control bg-surface-subtle px-3 py-6 text-center text-sm text-text-secondary">
          No one in {circle} yet. Use Move on someone in another circle, or add a contact.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border-hairline">
          {shown.map((contact) => {
            const moving = movingId === contact.id
            return (
              <li key={contact.id} className="flex items-center gap-3 py-3">
                <Avatar name={contact.name} size={36} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="flex min-w-0 items-center gap-2">
                    <Link
                      to={`/contacts/${contact.id}`}
                      className="truncate text-sm font-medium text-text-primary transition-colors hover:text-brand-600"
                    >
                      {contact.name}
                    </Link>
                    {isDue(contact, today) ? <Badge variant="error">Due</Badge> : null}
                  </span>
                  <span className="truncate text-xs text-text-secondary">
                    {contact.last_contacted_at
                      ? `Last contacted ${relativeTime(contact.last_contacted_at)}`
                      : 'Not contacted yet'}
                  </span>
                </div>
                {moving ? (
                  <span className="inline-flex h-10 shrink-0 items-center gap-2 px-2 text-xs text-text-secondary">
                    <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Moving
                  </span>
                ) : (
                  <select
                    aria-label={`Move ${contact.name} to another circle`}
                    value=""
                    disabled={movingId !== null}
                    onChange={(e) => {
                      const next = CIRCLES.find((c) => c === e.target.value)
                      if (next) onMove(contact, next)
                    }}
                    className="h-10 w-24 shrink-0 rounded-control border border-border-hairline bg-surface px-2 text-base text-text-secondary transition-colors sm:text-sm hover:text-text-primary focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
                  >
                    <option value="" disabled>
                      Move
                    </option>
                    {targets.map((c) => (
                      <option key={c} value={c}>
                        {`To ${c}`}
                      </option>
                    ))}
                  </select>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {members.length > PREVIEW_COUNT ? (
        <Button variant="ghost" className="mt-2 w-full" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : `Show all ${members.length}`}
        </Button>
      ) : null}
    </section>
  )
}
