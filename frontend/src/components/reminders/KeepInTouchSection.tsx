import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageSection } from '@/components/ui/PageSection'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/toast-context'
import { ActivityIcon, CheckIcon, RefreshIcon } from '@/components/icons'
import { CIRCLE_META } from '@/components/circles/meta'
import { InteractionFormModal } from '@/components/interactions/InteractionFormModal'
import { apiErrorMessage } from '@/lib/api/errors'
import { listContacts, type Contact } from '@/lib/api'
import { daysFromToday, dueLabel, relativeTime, todayISO } from '@/lib/format'

type DueContact = Contact & { reconnect_due_on: string }

/** Contacts whose keep-in-touch cadence is due today or earlier, most overdue first. */
export function KeepInTouchSection() {
  const toast = useToast()
  const [contacts, setContacts] = useState<Contact[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [logFor, setLogFor] = useState<Contact | null>(null)

  const load = useCallback(async () => {
    setFailed(false)
    try {
      setContacts(await listContacts())
    } catch (err) {
      setFailed(true)
      toast.error(apiErrorMessage(err, 'Could not load your contacts.'))
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  const closeLog = useCallback(() => setLogFor(null), [])
  const handleLogged = useCallback(() => void load(), [load])

  const today = todayISO()
  const due = (contacts ?? [])
    .filter((c): c is DueContact => c.reconnect_due_on !== null && c.reconnect_due_on <= today)
    .sort((a, b) => a.reconnect_due_on.localeCompare(b.reconnect_due_on) || a.name.localeCompare(b.name))
  const hasCadence = (contacts ?? []).some((c) => c.stay_in_touch_days !== null)

  function renderBody() {
    if (contacts === null) {
      return failed ? (
        <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
          <span>Could not load your contacts.</span>
          <Button variant="secondary" icon={<RefreshIcon width={16} height={16} />} onClick={() => void load()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )
    }

    if (due.length > 0) {
      return (
        <ul className="-my-1 divide-y divide-border-hairline">
          {due.map((c) => (
            <KeepInTouchRow key={c.id} contact={c} onLog={setLogFor} />
          ))}
        </ul>
      )
    }

    return (
      <div className="flex items-start gap-3 rounded-control bg-surface-subtle px-3 py-3 text-sm">
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-badge-success-bg text-badge-success-fg">
          <CheckIcon width={14} height={14} aria-hidden="true" />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="font-medium text-text-primary">Everyone with a cadence is up to date</p>
          {hasCadence ? null : (
            <p className="mt-1 text-text-secondary">
              {
                "No one has a cadence yet. Set a keep-in-touch cadence on a contact's edit form and they show up here when it is time to reconnect. "
              }
              <Link to="/contacts" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                Go to contacts
              </Link>
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <PageSection
      title="Keep in touch"
      description="People whose keep-in-touch cadence is due, most overdue first."
      actions={due.length > 0 ? <Badge variant="error">{`${due.length} due`}</Badge> : undefined}
    >
      {renderBody()}

      <InteractionFormModal
        open={logFor !== null}
        onClose={closeLog}
        contactId={logFor?.id}
        onSaved={handleLogged}
      />
    </PageSection>
  )
}

function KeepInTouchRow({ contact: c, onLog }: { contact: DueContact; onLog: (contact: Contact) => void }) {
  const overdue = daysFromToday(c.reconnect_due_on) < 0
  return (
    <li className="flex items-start gap-3 py-3">
      <Avatar name={c.name} size={40} />
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              to={`/contacts/${c.id}`}
              className="min-w-0 max-w-full truncate text-sm font-medium text-text-primary hover:text-brand-600 hover:underline dark:hover:text-brand-400"
            >
              {c.name}
            </Link>
            {overdue ? (
              <Badge variant="error">{dueLabel(c.reconnect_due_on)}</Badge>
            ) : (
              <Badge variant="pending">Due today</Badge>
            )}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <span className={`inline-block size-2 rounded-full ${CIRCLE_META[c.circle].dot}`} aria-hidden="true" />
              {c.circle}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {c.last_contacted_at ? `Last contacted ${relativeTime(c.last_contacted_at)}` : 'Never contacted'}
            </span>
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<ActivityIcon width={16} height={16} />}
          onClick={() => onLog(c)}
          className="self-start sm:self-auto"
        >
          Log interaction
        </Button>
      </div>
    </li>
  )
}
