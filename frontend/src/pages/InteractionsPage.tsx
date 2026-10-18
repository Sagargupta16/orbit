import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PageContainer, PageHeader } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/toast-context'
import { ActivityIcon, AlertIcon, PlusIcon } from '@/components/icons'
import { InteractionFormModal } from '@/components/interactions/InteractionFormModal'
import { InteractionItem } from '@/components/interactions/InteractionItem'
import { KIND_META } from '@/components/interactions/kinds'
import { apiErrorMessage } from '@/lib/api/errors'
import {
  INTERACTION_KINDS,
  deleteInteraction,
  listInteractions,
  type Interaction,
  type InteractionKind,
} from '@/lib/api'
import { addDaysISO, formatDate, formatMonthDay, toISODate, todayISO } from '@/lib/format'

const PAGE_SIZE = 50

type KindFilter = InteractionKind | 'all'

const time = (i: Interaction) => Date.parse(i.occurred_at)

function byNewest(a: Interaction, b: Interaction): number {
  return time(b) - time(a) || b.id - a.id
}

function oldestOf(items: Interaction[]): Interaction | null {
  return items.reduce<Interaction | null>((o, i) => (o === null || time(i) < time(o) ? i : o), null)
}

function startOfWeek(now: Date): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // weeks start on Monday
  return d
}

function dayLabel(day: string, today: string): string {
  if (day === today) return 'Today'
  if (day === addDaysISO(today, -1)) return 'Yesterday'
  return formatDate(day)
}

interface DayGroup {
  day: string
  label: string
  items: Interaction[]
}

function groupByDay(items: Interaction[]): DayGroup[] {
  const today = todayISO()
  const groups: DayGroup[] = []
  for (const item of items) {
    const day = toISODate(new Date(item.occurred_at))
    const last = groups.at(-1)
    if (last?.day === day) last.items.push(item)
    else groups.push({ day, label: dayLabel(day, today), items: [item] })
  }
  return groups
}

interface PeriodCount {
  count: number
  since: Date
  /** False when older pages are not loaded yet, so the count may be low. */
  exact: boolean
}

export function InteractionsPage() {
  const toast = useToast()
  const [items, setItems] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Interaction | null>(null)
  const [deleting, setDeleting] = useState<Interaction | null>(null)

  const loadFirstPage = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const page = await listInteractions({ limit: PAGE_SIZE })
      setItems(page)
      setHasMore(page.length === PAGE_SIZE)
    } catch (err) {
      setLoadError(apiErrorMessage(err, 'Could not load your interactions.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFirstPage()
  }, [loadFirstPage])

  async function loadMore() {
    const oldest = oldestOf(items)
    if (!oldest) return
    setLoadingMore(true)
    try {
      const page = await listInteractions({ limit: PAGE_SIZE, before: oldest.occurred_at })
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id))
        return [...prev, ...page.filter((i) => !seen.has(i.id))]
      })
      setHasMore(page.length === PAGE_SIZE)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not load older interactions.'))
    } finally {
      setLoadingMore(false)
    }
  }

  // Keep the loaded list a contiguous newest-first slice of the server's list:
  // an interaction saved older than everything loaded shows up on "Load more".
  function handleSaved(saved: Interaction) {
    setItems((prev) => {
      const rest = prev.filter((i) => i.id !== saved.id)
      const oldest = oldestOf(rest)
      if (hasMore && oldest && time(saved) < time(oldest)) return rest
      return [...rest, saved]
    })
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteInteraction(deleting.id)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not delete the interaction.'))
      throw err // keeps the confirm dialog open
    }
    const id = deleting.id
    toast.success('Interaction deleted')
    // Deleting the last loaded row while older pages exist: fetch them instead of showing empty.
    if (hasMore && items.length === 1) void loadFirstPage()
    else setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (interaction: Interaction) => {
    setEditing(interaction)
    setFormOpen(true)
  }
  const closeForm = useCallback(() => setFormOpen(false), [])
  const closeDelete = useCallback(() => setDeleting(null), [])

  const sorted = useMemo(() => [...items].sort(byNewest), [items])

  const groups = useMemo(
    () => groupByDay(kindFilter === 'all' ? sorted : sorted.filter((i) => i.kind === kindFilter)),
    [sorted, kindFilter],
  )

  const summary = useMemo(() => {
    const now = new Date()
    const oldest = sorted.at(-1)
    const count = (since: Date): PeriodCount => ({
      count: sorted.filter((i) => time(i) >= since.getTime()).length,
      since,
      exact: !hasMore || (oldest !== undefined && time(oldest) < since.getTime()),
    })
    return {
      week: count(startOfWeek(now)),
      month: count(new Date(now.getFullYear(), now.getMonth(), 1)),
    }
  }, [sorted, hasMore])

  const logButton = (
    <Button icon={<PlusIcon width={16} height={16} />} onClick={openCreate}>
      Log interaction
    </Button>
  )

  return (
    <PageContainer>
      <PageHeader
        title="Interactions"
        subtitle="Keep track of every call, message and catch-up with the people in your orbit."
        actions={logButton}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : loadError ? (
        <EmptyState
          icon={<AlertIcon width={20} height={20} />}
          title="Interactions did not load"
          body={loadError}
          action={
            <Button variant="secondary" onClick={() => void loadFirstPage()}>
              Try again
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ActivityIcon width={20} height={20} />}
          title="No interactions yet"
          body="Log calls, emails, messages and meetings to see who you have been talking to and when."
          action={logButton}
        />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              <SummaryTile label="This week" period={summary.week} />
              <SummaryTile label="This month" period={summary.month} />
            </div>
            {summary.week.exact && summary.month.exact ? null : (
              <p className="text-xs text-text-secondary">
                Counted from the last {items.length} interactions. Load more below for the full count.
              </p>
            )}
          </div>

          <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-2">
            <FilterChip active={kindFilter === 'all'} onClick={() => setKindFilter('all')}>
              All
            </FilterChip>
            {INTERACTION_KINDS.map((k) => {
              const { label, icon: Icon } = KIND_META[k]
              return (
                <FilterChip key={k} active={kindFilter === k} onClick={() => setKindFilter(k)}>
                  <Icon width={14} height={14} aria-hidden="true" />
                  {label}
                </FilterChip>
              )
            })}
          </div>

          {groups.length === 0 && kindFilter !== 'all' ? (
            <div className="rounded-card bg-surface px-6 py-10 text-center text-sm text-text-secondary shadow-sm">
              Nothing logged as {KIND_META[kindFilter].label}{' '}
              {hasMore ? `in the last ${items.length} interactions.` : 'yet.'}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {groups.map((group) => (
                <section key={group.day} aria-label={group.label}>
                  <h2 className="sticky top-[calc(3.5rem_+_1px_+_env(safe-area-inset-top))] z-10 -mx-4 flex items-center justify-between bg-canvas px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text-secondary sm:-mx-6 sm:px-6 md:top-0 lg:-mx-8 lg:px-8">
                    <span>{group.label}</span>
                    <span className="font-medium normal-case tracking-normal">
                      {group.items.length} {group.items.length === 1 ? 'interaction' : 'interactions'}
                    </span>
                  </h2>
                  <ul className="divide-y divide-border-hairline rounded-card bg-surface px-4 shadow-sm sm:px-5">
                    {group.items.map((interaction) => (
                      <InteractionItem
                        key={interaction.id}
                        interaction={interaction}
                        onEdit={() => openEdit(interaction)}
                        onDelete={() => setDeleting(interaction)}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <div className="flex justify-center pt-2">
            {hasMore ? (
              <Button variant="secondary" loading={loadingMore} onClick={() => void loadMore()}>
                Load more
              </Button>
            ) : (
              <p className="text-xs text-text-secondary">
                That is everything: {items.length} {items.length === 1 ? 'interaction' : 'interactions'} in total.
              </p>
            )}
          </div>
        </>
      )}

      <InteractionFormModal
        open={formOpen}
        onClose={closeForm}
        interaction={editing}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete interaction"
        message={
          deleting
            ? `Delete the ${KIND_META[deleting.kind].label.toLowerCase()} with ${deleting.contact_name} on ${formatDate(deleting.occurred_at)}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={closeDelete}
      />
    </PageContainer>
  )
}

function SummaryTile({ label, period }: { label: string; period: PeriodCount }) {
  return (
    <div className="rounded-card bg-surface p-4 shadow-sm">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">
        {period.count}
        {period.exact ? '' : '+'}
      </p>
      <p className="mt-0.5 text-xs text-text-secondary">Since {formatMonthDay(toISODate(period.since))}</p>
    </div>
  )
}

interface FilterChipProps {
  active: boolean
  onClick: () => void
  children: ReactNode
}

function FilterChip({ active, onClick, children }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-1.5 rounded-badge border px-3.5 text-sm font-medium transition-colors ${
        active
          ? 'border-transparent bg-brand-600 text-white'
          : 'border-border-hairline bg-surface text-text-secondary hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  )
}
