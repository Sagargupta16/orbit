import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarIcon, CheckIcon, EditIcon, MoreIcon, TrashIcon, UsersIcon } from '@/components/icons'
import type { Reminder } from '@/lib/api'
import { daysFromToday, dueLabel, formatDate } from '@/lib/format'

interface ReminderItemProps {
  reminder: Reminder
  busy: boolean
  onToggle: (reminder: Reminder) => void
  onEdit: (reminder: Reminder) => void
  onDelete: (reminder: Reminder) => void
}

function ringClass(done: boolean, busy: boolean): string {
  if (done) return 'border-brand-600 bg-brand-600 text-white'
  const icon = busy ? 'text-brand-500' : 'text-transparent'
  return `border-text-placeholder ${icon} group-hover:border-brand-500 group-hover:bg-brand-50 group-hover:text-brand-500`
}

function dueText(due: string): { text: string; tone: string } {
  const days = daysFromToday(due)
  if (days < 0) return { text: dueLabel(due), tone: 'text-badge-error-fg' }
  if (days === 0) return { text: 'Due today', tone: 'text-badge-pending-fg' }
  return { text: `Due ${dueLabel(due)}`, tone: 'text-text-secondary' }
}

/** One reminder row: round complete toggle, title, due or done date, contact, notes, menu. */
export function ReminderItem({ reminder: r, busy, onToggle, onEdit, onDelete }: ReminderItemProps) {
  const due = dueText(r.due_date)

  return (
    <li className="flex items-start gap-2 py-2 sm:gap-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={r.done}
        aria-label={r.done ? `Mark "${r.title}" as not done` : `Mark "${r.title}" as done`}
        disabled={busy}
        onClick={() => onToggle(r)}
        className="group -ml-1.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full disabled:cursor-wait"
      >
        <span
          className={`inline-flex size-7 items-center justify-center rounded-full border-2 transition duration-200 group-active:scale-90 ${ringClass(r.done, busy)}`}
        >
          {busy ? (
            <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <CheckIcon width={16} height={16} strokeWidth={3} />
          )}
        </span>
      </button>

      <div className="min-w-0 flex-1 pt-2.5">
        <p
          className={`break-words text-sm font-medium ${
            r.done ? 'text-text-secondary line-through' : 'text-text-primary'
          }`}
        >
          {r.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {r.done ? (
            <span className="inline-flex items-center gap-1 text-text-secondary">
              <CheckIcon width={12} height={12} aria-hidden="true" />
              {`Done ${formatDate(r.done_at)}`}
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 font-medium ${due.tone}`}>
              <CalendarIcon width={12} height={12} aria-hidden="true" />
              {due.text}
              <span className="font-normal text-text-secondary">{`· ${formatDate(r.due_date)}`}</span>
            </span>
          )}
          {r.contact_id !== null ? (
            <Link
              to={`/contacts/${r.contact_id}`}
              className="-my-2 inline-flex items-center gap-1 py-2 text-text-secondary hover:text-brand-600 hover:underline dark:hover:text-brand-400"
            >
              <UsersIcon width={12} height={12} aria-hidden="true" />
              {r.contact_name ?? 'Contact'}
            </Link>
          ) : null}
        </div>
        {r.notes ? (
          <p className="mt-1 line-clamp-2 whitespace-pre-line break-words text-sm text-text-secondary">
            {r.notes}
          </p>
        ) : null}
      </div>

      <ReminderMenu title={r.title} onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} />
    </li>
  )
}

interface ReminderMenuProps {
  title: string
  onEdit: () => void
  onDelete: () => void
}

function ReminderMenu({ title, onEdit, onDelete }: ReminderMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (e.target instanceof Node && !rootRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function pick(action: () => void) {
    setOpen(false)
    action()
  }

  return (
    <div ref={rootRef} className="relative -mr-1.5 shrink-0">
      <button
        type="button"
        aria-label={`Actions for "${title}"`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-10 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
      >
        <MoreIcon width={18} height={18} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-10 mt-1 w-40 animate-fade-in overflow-hidden rounded-control border border-border-hairline bg-surface py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => pick(onEdit)}
            className="flex h-10 w-full items-center gap-2 px-3 text-left text-sm text-text-primary transition-colors hover:bg-surface-subtle"
          >
            <EditIcon width={14} height={14} aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => pick(onDelete)}
            className="flex h-10 w-full items-center gap-2 px-3 text-left text-sm text-badge-error-fg transition-colors hover:bg-badge-error-bg"
          >
            <TrashIcon width={14} height={14} aria-hidden="true" />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  )
}
