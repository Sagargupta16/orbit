import { Link } from 'react-router-dom'
import { BellIcon, CakeIcon } from '@/components/icons'
import { Badge } from '@/components/ui/StatusBadge'
import { PageSection } from '@/components/ui/PageSection'
import type { BirthdayItem, Reminder } from '@/lib/api/types'
import { daysFromToday, dueLabel, formatMonthDay } from '@/lib/format'
import { CardHint, CardSubheading, ContactLink, ViewAllLink } from './card-parts'

function DueTag({ date }: { date: string }) {
  const days = daysFromToday(date)
  if (days < 0) return <Badge variant="error">{dueLabel(date)}</Badge>
  if (days === 0) return <Badge variant="pending">Due today</Badge>
  return <span className="text-xs whitespace-nowrap text-text-secondary">{dueLabel(date)}</span>
}

function birthdayLabel(daysUntil: number): string {
  return daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`
}

interface ComingUpCardProps {
  reminders: Reminder[]
  birthdays: BirthdayItem[]
  className?: string
}

/** Next open reminders (overdue first) and birthdays in the next 30 days. */
export function ComingUpCard({ reminders, birthdays, className = '' }: ComingUpCardProps) {
  return (
    <PageSection
      title="Coming up"
      description="Reminders and birthdays on the horizon"
      actions={<ViewAllLink to="/reminders">All reminders</ViewAllLink>}
      className={className}
    >
      <div className="flex flex-col gap-4">
        <div>
          <CardSubheading>Reminders</CardSubheading>
          {reminders.length === 0 ? (
            <CardHint>
              Nothing scheduled.{' '}
              <Link to="/reminders" className="font-medium text-brand-600 hover:underline">
                Add a reminder
              </Link>{' '}
              so a follow-up never slips.
            </CardHint>
          ) : (
            <ul className="divide-y divide-border-hairline">
              {reminders.map((r) => {
                const overdue = daysFromToday(r.due_date) < 0
                return (
                  <li key={r.id} className="flex items-center gap-3 py-3">
                    <span
                      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full ${
                        overdue ? 'bg-badge-error-bg text-badge-error-fg' : 'bg-brand-50 text-brand-600'
                      }`}
                    >
                      <BellIcon width={16} height={16} />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium text-text-primary">{r.title}</span>
                      {r.contact_id !== null && r.contact_name ? (
                        <span className="flex min-w-0 text-xs text-text-secondary">
                          <ContactLink id={r.contact_id} name={r.contact_name} />
                        </span>
                      ) : null}
                    </div>
                    <DueTag date={r.due_date} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div>
          <CardSubheading>Birthdays</CardSubheading>
          {birthdays.length === 0 ? (
            <CardHint>No birthdays in the next 30 days.</CardHint>
          ) : (
            <ul className="divide-y divide-border-hairline">
              {birthdays.map((b) => (
                <li key={b.contact_id} className="flex items-center gap-3 py-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-badge-success-bg text-badge-success-fg">
                    <CakeIcon width={16} height={16} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col text-sm">
                    <ContactLink id={b.contact_id} name={b.name} />
                    <span className="text-xs text-text-secondary">{formatMonthDay(b.next_on)}</span>
                  </div>
                  {b.days_until <= 0 ? (
                    <Badge variant="success">Today</Badge>
                  ) : (
                    <span className="text-xs whitespace-nowrap text-text-secondary">{birthdayLabel(b.days_until)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageSection>
  )
}
