import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { EditIcon, TrashIcon } from '@/components/icons'
import { KIND_META } from '@/components/interactions/kinds'
import type { Interaction } from '@/lib/api'

/** "3:20 PM" in local time, matching formatDateTime in lib/format. */
function formatTime(value: string): string {
  const d = new Date(value)
  const h = d.getHours()
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

/** Notes clamped to three lines, with a more/less toggle only when they overflow. */
function ClampedNotes({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || expanded) return
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 1)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [text, expanded])

  return (
    <div className="mt-1.5">
      <p
        ref={ref}
        className={`max-w-prose whitespace-pre-line break-words text-sm text-text-primary ${
          expanded ? '' : 'line-clamp-3'
        }`}
      >
        {text}
      </p>
      {overflows ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="-ml-1 inline-flex min-h-10 items-center px-1 text-sm font-medium text-brand-600 hover:underline sm:min-h-8 dark:text-brand-400"
        >
          {expanded ? 'less' : 'more'}
        </button>
      ) : null}
    </div>
  )
}

interface InteractionItemProps {
  interaction: Interaction
  onEdit: () => void
  onDelete: () => void
}

/** One row of the interaction feed: kind icon, contact link, kind and time, notes, actions. */
export function InteractionItem({ interaction, onEdit, onDelete }: InteractionItemProps) {
  const { label, icon: Icon } = KIND_META[interaction.kind]
  return (
    <li className="flex gap-3 py-3.5">
      <span
        className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
        aria-hidden="true"
      >
        <Icon width={18} height={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 pt-0.5">
            <Link
              to={`/contacts/${interaction.contact_id}`}
              className="-my-2.5 block truncate py-2.5 text-sm font-semibold text-text-primary hover:text-brand-600 dark:hover:text-brand-400"
            >
              {interaction.contact_name}
            </Link>
            <p className="mt-0.5 text-xs text-text-secondary">
              {label}
              <span aria-hidden="true"> · </span>
              <time dateTime={interaction.occurred_at}>{formatTime(interaction.occurred_at)}</time>
            </p>
          </div>
          <div className="-mr-2 -mt-1.5 flex shrink-0">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${label.toLowerCase()} with ${interaction.contact_name}`}
              className="inline-flex size-10 items-center justify-center rounded-control text-text-placeholder transition-colors hover:bg-surface-subtle hover:text-text-primary"
            >
              <EditIcon width={16} height={16} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete ${label.toLowerCase()} with ${interaction.contact_name}`}
              className="inline-flex size-10 items-center justify-center rounded-control text-text-placeholder transition-colors hover:bg-surface-subtle hover:text-badge-error-fg"
            >
              <TrashIcon width={16} height={16} />
            </button>
          </div>
        </div>
        {interaction.notes ? <ClampedNotes text={interaction.notes} /> : null}
      </div>
    </li>
  )
}
