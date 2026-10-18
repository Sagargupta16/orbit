import { useCallback, useEffect, useRef, useState, type ComponentProps } from 'react'
import { PageContainer, PageHeader } from '@/components/layout/PageContainer'
import { PageSection } from '@/components/ui/PageSection'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/StatusBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/toast-context'
import { BellIcon, CheckIcon, PlusIcon, RefreshIcon } from '@/components/icons'
import { KeepInTouchSection } from '@/components/reminders/KeepInTouchSection'
import { ReminderFormModal } from '@/components/reminders/ReminderFormModal'
import { ReminderItem } from '@/components/reminders/ReminderItem'
import { apiErrorMessage } from '@/lib/api/errors'
import {
  deleteReminder,
  listReminders,
  updateReminder,
  type Reminder,
  type ReminderStatusFilter,
} from '@/lib/api'
import { daysFromToday } from '@/lib/format'

const STATUS_OPTIONS: { value: ReminderStatusFilter; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'done', label: 'Done' },
  { value: 'all', label: 'All' },
]

type GroupKey = 'overdue' | 'today' | 'week' | 'later' | 'done'

const GROUP_META: Record<GroupKey, { label: string; badge: ComponentProps<typeof Badge>['variant'] }> = {
  overdue: { label: 'Overdue', badge: 'error' },
  today: { label: 'Today', badge: 'pending' },
  week: { label: 'This week', badge: 'active' },
  later: { label: 'Later', badge: 'paused' },
  done: { label: 'Done', badge: 'success' },
}

const GROUP_ORDER: GroupKey[] = ['overdue', 'today', 'week', 'later', 'done']

/**
 * Buckets reminders by due date (Overdue, Today, This week = next 6 days, Later).
 * Done reminders go to their own group, except in the Open view, where an item
 * just ticked off stays in place (shown as done) until the list reloads.
 */
function groupReminders(items: Reminder[], status: ReminderStatusFilter) {
  const groups: Record<GroupKey, Reminder[]> = { overdue: [], today: [], week: [], later: [], done: [] }
  for (const r of items) {
    if (status === 'done' || (status === 'all' && r.done)) {
      groups.done.push(r)
      continue
    }
    const days = daysFromToday(r.due_date)
    if (days < 0) groups.overdue.push(r)
    else if (days === 0) groups.today.push(r)
    else if (days < 7) groups.week.push(r)
    else groups.later.push(r)
  }
  return GROUP_ORDER.filter((key) => groups[key].length > 0).map((key) => ({ key, items: groups[key] }))
}

export function RemindersPage() {
  const toast = useToast()
  const [status, setStatus] = useState<ReminderStatusFilter>('open')
  const [reminders, setReminders] = useState<Reminder[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [busyIds, setBusyIds] = useState<ReadonlySet<number>>(new Set())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Reminder | null>(null)
  const [deleting, setDeleting] = useState<Reminder | null>(null)
  // Only the latest request may write the list, so a slow response for an old
  // filter cannot overwrite the current one.
  const requestId = useRef(0)

  const load = useCallback(
    async (next: ReminderStatusFilter) => {
      const id = ++requestId.current
      setLoadFailed(false)
      try {
        const rows = await listReminders({ status: next })
        if (id === requestId.current) setReminders(rows)
      } catch (err) {
        if (id !== requestId.current) return
        setLoadFailed(true)
        toast.error(apiErrorMessage(err, 'Could not load reminders.'))
      }
    },
    [toast],
  )

  useEffect(() => {
    void load(status)
  }, [load, status])

  function changeStatus(next: ReminderStatusFilter) {
    if (next === status) return
    setReminders(null)
    setStatus(next)
  }

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = useCallback((reminder: Reminder) => {
    setEditing(reminder)
    setFormOpen(true)
  }, [])

  const closeForm = useCallback(() => {
    setFormOpen(false)
    setEditing(null)
  }, [])

  const closeDelete = useCallback(() => setDeleting(null), [])

  function handleSaved() {
    // A new reminder is open, so show it rather than leaving the Done view up.
    if (!editing && status === 'done') changeStatus('open')
    else void load(status)
  }

  async function toggleDone(reminder: Reminder) {
    setBusyIds((prev) => new Set(prev).add(reminder.id))
    try {
      const updated = await updateReminder(reminder.id, { done: !reminder.done })
      // Update in place: a ticked item stays visible (as done) until the next reload.
      setReminders((prev) => (prev ? prev.map((r) => (r.id === updated.id ? updated : r)) : prev))
      toast.success(updated.done ? 'Marked done' : 'Marked not done')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update the reminder.'))
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev)
        next.delete(reminder.id)
        return next
      })
    }
  }

  async function confirmDelete() {
    const target = deleting
    if (!target) return
    try {
      await deleteReminder(target.id)
      setReminders((prev) => (prev ? prev.filter((r) => r.id !== target.id) : prev))
      toast.success('Reminder deleted')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not delete the reminder.'))
    }
  }

  const addButton = (
    <Button icon={<PlusIcon width={16} height={16} />} onClick={openCreate}>
      Add reminder
    </Button>
  )

  function renderList() {
    if (reminders === null) {
      return loadFailed ? (
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-card bg-surface px-6 py-10 text-sm text-text-secondary shadow-sm">
          <span>Could not load reminders.</span>
          <Button variant="secondary" icon={<RefreshIcon width={16} height={16} />} onClick={() => void load(status)}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )
    }

    if (reminders.length === 0 && status === 'done') {
      return (
        <EmptyState
          icon={<CheckIcon width={20} height={20} />}
          title="Nothing marked done yet"
          body="Tick off a reminder and it lands here."
          action={
            <Button variant="secondary" onClick={() => changeStatus('open')}>
              View open reminders
            </Button>
          }
        />
      )
    }

    if (reminders.length === 0) {
      return (
        <EmptyState
          icon={<BellIcon width={20} height={20} />}
          title={status === 'open' ? 'No open reminders' : 'No reminders yet'}
          body="Add a reminder for the follow-ups you do not want to forget: a call, a gift, a thank-you note."
          action={addButton}
        />
      )
    }

    return (
      <div className="flex flex-col gap-4">
        {groupReminders(reminders, status).map((group) => (
          <PageSection
            key={group.key}
            title={GROUP_META[group.key].label}
            actions={<Badge variant={GROUP_META[group.key].badge}>{String(group.items.length)}</Badge>}
          >
            <ul className="-my-1 divide-y divide-border-hairline">
              {group.items.map((r) => (
                <ReminderItem
                  key={r.id}
                  reminder={r}
                  busy={busyIds.has(r.id)}
                  onToggle={(item) => void toggleDone(item)}
                  onEdit={openEdit}
                  onDelete={setDeleting}
                />
              ))}
            </ul>
          </PageSection>
        ))}
      </div>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Reminders"
        subtitle="Follow-ups to do and people to reconnect with."
        actions={addButton}
      />

      <KeepInTouchSection />

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <h2 className="text-base font-semibold tracking-tight text-text-primary">Your reminders</h2>
        <div
          role="group"
          aria-label="Show reminders"
          className="flex w-full rounded-control bg-surface p-1 shadow-sm sm:w-auto"
        >
          {STATUS_OPTIONS.map((option) => {
            const selected = option.value === status
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => changeStatus(option.value)}
                className={`h-10 flex-1 rounded-control px-4 text-sm font-medium transition-colors sm:flex-none ${
                  selected
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {renderList()}

      <ReminderFormModal open={formOpen} onClose={closeForm} reminder={editing} onSaved={handleSaved} />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete reminder?"
        message={
          <>
            <span className="font-medium text-text-primary">{deleting?.title}</span>
            {' will be removed. This cannot be undone.'}
          </>
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={closeDelete}
      />
    </PageContainer>
  )
}
