import type { ComponentType, ReactNode, SVGProps } from 'react'
import { PageSection } from '@/components/ui/PageSection'
import { Badge } from '@/components/ui/StatusBadge'
import {
  CakeIcon,
  CalendarIcon,
  ClockIcon,
  MailIcon,
  MessageIcon,
  PhoneIcon,
  RefreshIcon,
} from '@/components/icons'
import type { Channel, Contact } from '@/lib/api'
import {
  daysFromToday,
  dueLabel,
  formatDate,
  formatDateTime,
  relativeTime,
  todayISO,
} from '@/lib/format'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

const CHANNEL_META: Record<Channel, { label: string; icon: IconComponent }> = {
  email: { label: 'Email', icon: MailIcon },
  call: { label: 'Call', icon: PhoneIcon },
  message: { label: 'Message', icon: MessageIcon },
}

const linkClass = 'break-all font-medium text-brand-600 hover:text-brand-700 hover:underline'

function Muted({ children = '-' }: { children?: ReactNode }) {
  return <span className="text-text-placeholder">{children}</span>
}

// The icon sits inside the <dt> (absolutely placed) so each row stays a valid dt/dd group.
function DetailRow({ icon: Icon, label, children }: { icon: IconComponent; label: string; children: ReactNode }) {
  return (
    <div className="relative min-w-0 py-3 pl-11">
      <dt className="text-xs text-text-secondary">
        <span
          className="absolute top-3 left-0 inline-flex size-8 items-center justify-center rounded-full bg-surface-subtle text-text-secondary"
          aria-hidden="true"
        >
          <Icon width={16} height={16} />
        </span>
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-text-primary">{children}</dd>
    </div>
  )
}

/** Next occurrence of a YYYY-MM-DD birthday, this year or next. */
function nextBirthday(birthday: string): string {
  const year = Number(todayISO().slice(0, 4))
  const thisYear = `${year}${birthday.slice(4, 10)}`
  return daysFromToday(thisYear) >= 0 ? thisYear : `${year + 1}${birthday.slice(4, 10)}`
}

function BirthdayValue({ birthday }: { birthday: string }) {
  const next = nextBirthday(birthday)
  const days = daysFromToday(next)
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {formatDate(birthday)}
      {days <= 30 ? <Badge variant={days === 0 ? 'success' : 'pending'}>{dueLabel(next)}</Badge> : null}
    </span>
  )
}

function CadenceValue({ contact }: { contact: Contact }) {
  const days = contact.stay_in_touch_days
  if (!days) return <Muted>No cadence</Muted>
  const due = contact.reconnect_due_on
  const overdue = due ? daysFromToday(due) < 0 : false
  return (
    <span className="flex flex-col gap-0.5">
      <span>{days === 1 ? 'Every day' : `Every ${days} days`}</span>
      {due ? (
        <span
          className={`text-xs ${overdue ? 'font-medium text-badge-error-fg' : 'text-text-secondary'}`}
          title={formatDate(due)}
        >
          Reconnect {dueLabel(due)}
        </span>
      ) : null}
    </span>
  )
}

/** Contact facts: how to reach them, birthday, cadence, and history dates. */
export function ContactDetailsCard({ contact }: { contact: Contact }) {
  const channel = CHANNEL_META[contact.channel]

  return (
    <PageSection title="Details">
      <dl className="-my-3 divide-y divide-border-hairline">
        <DetailRow icon={MailIcon} label="Email">
          {contact.email ? (
            <a href={`mailto:${contact.email}`} className={linkClass}>
              {contact.email}
            </a>
          ) : (
            <Muted />
          )}
        </DetailRow>
        <DetailRow icon={PhoneIcon} label="Phone">
          {contact.phone ? (
            <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} className={linkClass}>
              {contact.phone}
            </a>
          ) : (
            <Muted />
          )}
        </DetailRow>
        <DetailRow icon={CakeIcon} label="Birthday">
          {contact.birthday ? <BirthdayValue birthday={contact.birthday} /> : <Muted />}
        </DetailRow>
        <DetailRow icon={channel.icon} label="Preferred channel">
          {channel.label}
        </DetailRow>
        <DetailRow icon={RefreshIcon} label="Keep in touch">
          <CadenceValue contact={contact} />
        </DetailRow>
        <DetailRow icon={ClockIcon} label="Last contacted">
          {contact.last_contacted_at ? (
            <span title={formatDateTime(contact.last_contacted_at)}>{relativeTime(contact.last_contacted_at)}</span>
          ) : (
            <Muted>Never</Muted>
          )}
        </DetailRow>
        <DetailRow icon={CalendarIcon} label="Added">
          {formatDate(contact.created_at)}
        </DetailRow>
      </dl>
    </PageSection>
  )
}

/** Free-text notes, line breaks preserved. */
export function ContactNotesCard({ notes }: { notes: string }) {
  return (
    <PageSection title="Notes">
      <p className="text-sm break-words whitespace-pre-wrap text-text-primary">{notes}</p>
    </PageSection>
  )
}
