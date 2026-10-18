import { useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSection } from '@/components/ui/PageSection'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/toast-context'
import { KIND_META } from '@/components/interactions/kinds'
import { ActivityIcon, EditIcon, PlusIcon, TrashIcon } from '@/components/icons'
import { deleteInteraction, type Interaction } from '@/lib/api'
import { apiErrorMessage } from '@/lib/api/errors'
import { daysFromToday, formatDate, formatDateTime, toISODate } from '@/lib/format'
import type { LoadStatus } from './useContactDetail'
import { IconAction } from './IconAction'
import { LoadError } from './LoadError'

interface InteractionTimelineProps {
  contactName: string
  interactions: Interaction[]
  status: LoadStatus
  onRetry: () => Promise<void>
  onLog: () => void
  onEdit: (interaction: Interaction) => void
  /** Called after a delete so the page can reload interactions and the contact. */
  onChanged: () => Promise<void>
}

interface DayGroup {
  day: string
  items: Interaction[]
}

/** Newest first, bucketed by the local calendar day of occurred_at. */
function groupByDay(interactions: Interaction[]): DayGroup[] {
  const sorted = [...interactions].sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at))
  const groups: DayGroup[] = []
  for (const item of sorted) {
    const day = toISODate(new Date(item.occurred_at))
    const last = groups.at(-1)
    if (last && last.day === day) last.items.push(item)
    else groups.push({ day, items: [item] })
  }
  return groups
}

function dayLabel(day: string): string {
  const diff = daysFromToday(day)
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Yesterday'
  return formatDate(day)
}

/** "3:20 PM" in local time, same shape as the time in formatDateTime. */
function formatTime(value: string): string {
  const d = new Date(value)
  const h = d.getHours()
  return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

interface TimelineItemProps {
  item: Interaction
  showConnector: boolean
  onEdit: () => void
  onDelete: () => void
}

function TimelineItem({ item, showConnector, onEdit, onDelete }: TimelineItemProps) {
  const meta = KIND_META[item.kind]
  const Icon = meta.icon
  const kindLabel = meta.label.toLowerCase()
  const time = formatTime(item.occurred_at)

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {showConnector ? (
        <span
          className="absolute top-11 bottom-1 left-5 w-px -translate-x-1/2 bg-border-hairline"
          aria-hidden="true"
        />
      ) : null}
      <span
        className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"
        aria-hidden="true"
      >
        <Icon width={16} height={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-medium text-text-primary">{meta.label}</p>
            <p className="text-xs text-text-secondary">
              <time dateTime={item.occurred_at} title={formatDateTime(item.occurred_at)}>
                {time}
              </time>
            </p>
          </div>
          <div className="-mt-0.5 -mr-2 flex shrink-0">
            <IconAction label={`Edit ${kindLabel} at ${time}`} onClick={onEdit}>
              <EditIcon width={16} height={16} />
            </IconAction>
            <IconAction label={`Delete ${kindLabel} at ${time}`} tone="danger" onClick={onDelete}>
              <TrashIcon width={16} height={16} />
            </IconAction>
          </div>
        </div>
        {item.notes ? (
          <p className="mt-1 text-sm break-words whitespace-pre-wrap text-text-secondary">{item.notes}</p>
        ) : null}
      </div>
    </li>
  )
}

/** Every interaction with one contact, as a day-grouped vertical timeline. */
export function InteractionTimeline({
  contactName,
  interactions,
  status,
  onRetry,
  onLog,
  onEdit,
  onChanged,
}: InteractionTimelineProps) {
  const toast = useToast()
  const [deleting, setDeleting] = useState<Interaction | null>(null)
  const groups = useMemo(() => groupByDay(interactions), [interactions])
  const count = interactions.length
  // The API returns 50 per request by default, so a full page means older ones may exist.
  const countLabel = count >= 50 ? 'Latest 50' : `${count} logged`

  async function confirmDelete() {
    if (!deleting) return
    try {
      await deleteInteraction(deleting.id)
      toast.success('Interaction deleted')
      await onChanged()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not delete the interaction.'))
    }
  }

  let content: ReactNode
  if (status === 'error') {
    content = <LoadError title="Could not load interactions" onRetry={onRetry} />
  } else if (status === 'ready' && count === 0) {
    content = (
      <EmptyState
        icon={<ActivityIcon width={20} height={20} />}
        title="No interactions yet"
        body={`Log calls, emails, messages and meetings with ${contactName} to build a timeline.`}
        action={
          <Button icon={<PlusIcon width={16} height={16} />} onClick={onLog}>
            Log interaction
          </Button>
        }
      />
    )
  } else {
    content = (
      <PageSection
        title="Interactions"
        description={status === 'ready' ? countLabel : undefined}
        actions={
          <Button variant="secondary" icon={<PlusIcon width={16} height={16} />} onClick={onLog}>
            Log
          </Button>
        }
      >
        {status === 'loading' ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <ol className="flex flex-col gap-5">
            {groups.map((group) => (
              <li key={group.day}>
                <h3 className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
                  {dayLabel(group.day)}
                </h3>
                <ol className="mt-2">
                  {group.items.map((item, index) => (
                    <TimelineItem
                      key={item.id}
                      item={item}
                      showConnector={index < group.items.length - 1}
                      onEdit={() => onEdit(item)}
                      onDelete={() => setDeleting(item)}
                    />
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        )}
      </PageSection>
    )
  }

  return (
    <>
      {content}
      {/* Outside the branches so it stays mounted when the last interaction is deleted. */}
      <ConfirmDialog
        open={deleting !== null}
        title="Delete interaction?"
        message={
          deleting
            ? `The ${KIND_META[deleting.kind].label.toLowerCase()} on ${formatDateTime(deleting.occurred_at)} will be removed from ${contactName}'s timeline.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}
