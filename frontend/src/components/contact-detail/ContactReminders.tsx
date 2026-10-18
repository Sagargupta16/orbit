import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSection } from '@/components/ui/PageSection'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/toast-context'
import { BellIcon, EditIcon, PlusIcon, TrashIcon } from '@/components/icons'
import { deleteReminder, updateReminder, type Reminder } from '@/lib/api'
import { apiErrorMessage } from '@/lib/api/errors'
import { daysFromToday, dueLabel, formatDate, relativeTime } from '@/lib/format'
import type { LoadStatus } from './useContactDetail'
import { IconAction } from './IconAction'
import { LoadError } from './LoadError'

interface ContactRemindersProps {
  contactName: string
  reminders: Reminder[]
  status: LoadStatus
  onRetry: () => Promise<void>
  onAdd: () => void
  onEdit: (reminder: Reminder) => void
  /** Called after a toggle or delete so the page can reload reminders. */
  onChanged: () => Promise<void>
}

interface ReminderRowProps {
  reminder: Reminder
  toggling: boolean
  /** True while any reminder on the card is being toggled. */
  busy: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

function ReminderRow({ reminder, toggling, busy, onToggle, onEdit, onDelete }: ReminderRowProps) {
  const { done, title } = reminder
  const overdue = !done && daysFromToday(reminder.due_date) < 0

  let meta: ReactNode
  if (done) {
    meta = reminder.done_at ? `Done ${relativeTime(reminder.done_at)}` : 'Done'
  } else {
    meta = (
      <>
        {formatDate(reminder.due_date)}
        <span aria-hidden="true"> · </span>
        <span className={overdue ? 'font-medium text-badge-error-fg' : undefined}>
          {overdue ? dueLabel(reminder.due_date) : `Due ${dueLabel(reminder.due_date)}`}
        </span>
      </>
    )
  }

  return (
    <li className="flex items-start gap-1 py-1.5">
      <label className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center">
        {toggling ? (
          <span
            className="inline-block size-4 animate-spin rounded-full border-2 border-border-hairline border-t-brand-500"
            role="status"
            aria-label="Updating reminder"
          />
        ) : (
          <input
            type="checkbox"
            className="size-5 cursor-pointer accent-brand-500 disabled:cursor-not-allowed"
            checked={done}
            disabled={busy}
            onChange={onToggle}
            aria-label={done ? `Mark "${title}" as not done` : `Mark "${title}" as done`}
          />
        )}
      </label>
      <div className="min-w-0 flex-1 py-2">
        <p
          className={`text-sm break-words ${done ? 'text-text-secondary line-through' : 'font-medium text-text-primary'}`}
        >
          {title}
        </p>
        <p className="mt-0.5 text-xs text-text-secondary">{meta}</p>
        {reminder.notes ? (
          <p
            className={`mt-1 text-sm break-words whitespace-pre-wrap ${done ? 'text-text-placeholder' : 'text-text-secondary'}`}
          >
            {reminder.notes}
          </p>
        ) : null}
      </div>
      <div className="-mr-2 flex shrink-0">
        <IconAction label={`Edit "${title}"`} onClick={onEdit}>
          <EditIcon width={16} height={16} />
        </IconAction>
        <IconAction label={`Delete "${title}"`} tone="danger" onClick={onDelete}>
          <TrashIcon width={16} height={16} />
        </IconAction>
      </div>
    </li>
  )
}

/** Reminders tied to one contact: open ones by due date, then done ones, muted. */
export function ContactReminders({
  contactName,
  reminders,
  status,
  onRetry,
  onAdd,
  onEdit,
  onChanged,
}: ContactRemindersProps) {
  const toast = useToast()
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<Reminder | null>(null)
  // The API already sends open (due_date asc) before done (done_at desc).
  const open = reminders.filter((r) => !r.done)
  const done = reminders.filter((r) => r.done)

  async function toggle(reminder: Reminder) {
    setTogglingId(reminder.id)
    try {
      await updateReminder(reminder.id, { done: !reminder.done })
      toast.success(reminder.done ? 'Reminder reopened' : 'Reminder marked done')
      await onChanged()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not update the reminder.'))
    } finally {
      setTogglingId(null)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await deleteReminder(deleting.id)
      toast.success('Reminder deleted')
      await onChanged()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not delete the reminder.'))
    }
  }

  function renderRows(items: Reminder[]) {
    return (
      <ul className="-ml-2 flex flex-col">
        {items.map((r) => (
          <ReminderRow
            key={r.id}
            reminder={r}
            toggling={togglingId === r.id}
            busy={togglingId !== null}
            onToggle={() => void toggle(r)}
            onEdit={() => onEdit(r)}
            onDelete={() => setDeleting(r)}
          />
        ))}
      </ul>
    )
  }

  let content: ReactNode
  if (status === 'error') {
    content = <LoadError title="Could not load reminders" onRetry={onRetry} />
  } else if (status === 'ready' && reminders.length === 0) {
    content = (
      <EmptyState
        icon={<BellIcon width={20} height={20} />}
        title="No reminders"
        body={`Add a reminder to follow up with ${contactName}.`}
        action={
          <Button icon={<PlusIcon width={16} height={16} />} onClick={onAdd}>
            Add reminder
          </Button>
        }
      />
    )
  } else {
    content = (
      <PageSection
        title="Reminders"
        description={status === 'ready' ? `${open.length} open` : undefined}
        actions={
          <Button variant="secondary" icon={<PlusIcon width={16} height={16} />} onClick={onAdd}>
            Add
          </Button>
        }
      >
        {status === 'loading' ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {open.length > 0 ? (
              renderRows(open)
            ) : (
              <p className="text-sm text-text-secondary">Nothing open. You are all caught up.</p>
            )}
            {done.length > 0 ? (
              <div className="border-t border-border-hairline pt-3">
                <h3 className="text-xs font-semibold tracking-wide text-text-secondary uppercase">Done</h3>
                <div className="mt-1">{renderRows(done)}</div>
              </div>
            ) : null}
          </div>
        )}
      </PageSection>
    )
  }

  return (
    <>
      {content}
      {/* Outside the branches so it stays mounted when the last reminder is deleted. */}
      <ConfirmDialog
        open={deleting !== null}
        title="Delete reminder?"
        message={deleting ? `"${deleting.title}" will be removed. This cannot be undone.` : ''}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}
