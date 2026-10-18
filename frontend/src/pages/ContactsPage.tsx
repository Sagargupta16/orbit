import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer, PageHeader } from '@/components/layout/PageContainer'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/toast-context'
import {
  AlertIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  SparklesIcon,
  TrashIcon,
  UsersIcon,
} from '@/components/icons'
import { CIRCLE_META } from '@/components/circles/meta'
import { ContactFormModal } from '@/components/contacts/ContactFormModal'
import { ContactListRowMenu } from '@/components/contacts/ContactListRowMenu'
import { ContactListSampleNotice } from '@/components/contacts/ContactListSampleNotice'
import { ContactListToolbar } from '@/components/contacts/ContactListToolbar'
import { bulkDeleteContacts, deleteContact, listContacts } from '@/lib/api/contacts'
import { addSampleData, removeSampleData } from '@/lib/api/dashboard'
import { apiErrorMessage } from '@/lib/api/errors'
import type { Circle, Contact, ContactStatus } from '@/lib/api/types'
import { daysFromToday, dueLabel, relativeTime } from '@/lib/format'

const SEARCH_DEBOUNCE_MS = 250

/** What the confirm dialog is about to do. */
type PendingAction =
  | { kind: 'delete'; contact: Contact }
  | { kind: 'bulk'; ids: number[] }
  | { kind: 'samples' }

interface FormState {
  open: boolean
  contact: Contact | null
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Drop selected ids that are no longer in the list; keeps the same Set when nothing changed. */
function pruneSelection(prev: Set<string>, rows: Contact[]): Set<string> {
  if (prev.size === 0) return prev
  const visible = new Set(rows.map((c) => String(c.id)))
  const next = new Set([...prev].filter((id) => visible.has(id)))
  return next.size === prev.size ? prev : next
}

function reconnectCell(due: string | null): ReactNode {
  if (!due) return <span className="text-text-placeholder">-</span>
  const days = daysFromToday(due)
  const label = capitalize(dueLabel(due))
  if (days < 0) return <Badge variant="error">{label}</Badge>
  if (days === 0) return <Badge variant="pending">{label}</Badge>
  return <span className="text-text-secondary">{label}</span>
}

function confirmCopy(action: PendingAction): { title: string; message: string; confirmLabel: string } {
  switch (action.kind) {
    case 'delete':
      return {
        title: 'Delete contact',
        message: `Delete ${action.contact.name}? Their interactions and reminders are deleted too. This cannot be undone.`,
        confirmLabel: 'Delete',
      }
    case 'bulk':
      return {
        title: 'Delete selected contacts',
        message: `Delete ${plural(action.ids.length, 'contact')}? Their interactions and reminders are deleted too. This cannot be undone.`,
        confirmLabel: `Delete ${action.ids.length}`,
      }
    case 'samples':
      return {
        title: 'Remove sample data',
        message:
          'This deletes every sample contact, plus the sample interactions and reminders attached to them. Contacts you added yourself are kept.',
        confirmLabel: 'Remove sample data',
      }
  }
}

export function ContactsPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const requestRef = useRef(0)

  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [circle, setCircle] = useState<Circle | ''>('')
  const [status, setStatus] = useState<ContactStatus | ''>('')

  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [form, setForm] = useState<FormState>({ open: false, contact: null })
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [addingSamples, setAddingSamples] = useState(false)

  // Search hits the server, so wait for a pause in typing.
  useEffect(() => {
    const timer = window.setTimeout(() => setAppliedQuery(query.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [query])

  const load = useCallback(async () => {
    // Only the newest request may write state, so a slow older response cannot overwrite it.
    const requestId = ++requestRef.current
    setRefreshing(true)
    try {
      const rows = await listContacts({
        q: appliedQuery || undefined,
        circle: circle || undefined,
        status: status || undefined,
      })
      if (requestId !== requestRef.current) return
      setContacts(rows)
      setLoadError(null)
      setSelected((prev) => pruneSelection(prev, rows))
    } catch (err) {
      if (requestId !== requestRef.current) return
      const message = apiErrorMessage(err, 'Could not load contacts.')
      setLoadError(message)
      toast.error(message)
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [appliedQuery, circle, status, toast])

  useEffect(() => {
    void load()
  }, [load])

  const filtersApplied = appliedQuery !== '' || circle !== '' || status !== ''
  const hasSamples = contacts.some((c) => c.is_sample)
  const allSelected = contacts.length > 0 && contacts.every((c) => selected.has(String(c.id)))

  function clearFilters() {
    setQuery('')
    setAppliedQuery('')
    setCircle('')
    setStatus('')
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(contacts.map((c) => String(c.id))) : new Set())
  }

  const openCreate = () => setForm({ open: true, contact: null })
  const closeForm = useCallback(() => setForm({ open: false, contact: null }), [])
  const handleSaved = useCallback(() => {
    void load()
  }, [load])
  const closeConfirm = useCallback(() => setPending(null), [])

  async function runPending() {
    if (!pending) return
    try {
      if (pending.kind === 'delete') {
        await deleteContact(pending.contact.id)
        toast.success(`Deleted ${pending.contact.name}`)
      } else if (pending.kind === 'bulk') {
        const deleted = await bulkDeleteContacts(pending.ids)
        toast.success(`Deleted ${plural(deleted, 'contact')}`)
        setSelected(new Set())
      } else {
        const deleted = await removeSampleData()
        toast.success(`Removed ${plural(deleted, 'sample contact')}`)
      }
    } catch (err) {
      toast.error(apiErrorMessage(err))
      return
    }
    void load()
  }

  async function handleAddSamples() {
    setAddingSamples(true)
    try {
      const counts = await addSampleData()
      toast.success(
        `Added ${plural(counts.contacts, 'sample contact')}, ${plural(counts.interactions, 'interaction')} and ${plural(counts.reminders, 'reminder')}`,
      )
      await load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not add sample data.'))
    } finally {
      setAddingSamples(false)
    }
  }

  const columns: Column<Contact>[] = [
    {
      key: 'name',
      header: 'Name',
      mobilePrimary: true,
      sortValue: (c) => c.name.toLowerCase(),
      render: (c) => {
        const secondary = c.email ?? c.phone
        return (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={c.name} />
            <div className="min-w-0">
              <p className="flex min-w-0 items-center gap-2 font-medium text-text-primary">
                <span className="truncate">{c.name}</span>
                {c.is_sample ? (
                  <span className="shrink-0">
                    <Badge variant="paused">Sample</Badge>
                  </span>
                ) : null}
              </p>
              {secondary ? (
                <p className="truncate text-xs font-normal text-text-secondary">{secondary}</p>
              ) : null}
            </div>
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      mobileLabel: 'Status',
      sortValue: (c) => c.status,
      render: (c) => <StatusBadge status={c.status} />,
    },
    {
      key: 'circle',
      header: 'Circle',
      mobileLabel: 'Circle',
      sortValue: (c) => c.circle,
      render: (c) => (
        <span className="inline-flex items-center gap-2 text-text-secondary">
          <span className={`size-2 shrink-0 rounded-full ${CIRCLE_META[c.circle].dot}`} aria-hidden="true" />
          {c.circle}
        </span>
      ),
    },
    {
      key: 'company',
      header: 'Company',
      mobileLabel: 'Company',
      sortValue: (c) => (c.company ?? c.title ?? '').toLowerCase(),
      render: (c) => {
        const headline = c.company ?? c.title
        if (!headline) return <span className="text-text-placeholder">-</span>
        return (
          <div className="min-w-0">
            <p className="truncate text-text-primary">{headline}</p>
            {c.company && c.title ? <p className="truncate text-xs text-text-secondary">{c.title}</p> : null}
          </div>
        )
      },
    },
    {
      key: 'last_contacted_at',
      header: 'Last contacted',
      mobileLabel: 'Last contacted',
      sortValue: (c) => (c.last_contacted_at ? Date.parse(c.last_contacted_at) : 0),
      render: (c) => (
        <span className={c.last_contacted_at ? 'text-text-secondary' : 'text-text-placeholder'}>
          {relativeTime(c.last_contacted_at)}
        </span>
      ),
    },
    {
      key: 'reconnect_due_on',
      header: 'Reconnect',
      mobileLabel: 'Reconnect due',
      // No cadence sorts last.
      sortValue: (c) => c.reconnect_due_on ?? '9999-12-31',
      render: (c) => reconnectCell(c.reconnect_due_on),
    },
    {
      key: 'actions',
      header: '',
      mobileLabel: 'Actions',
      align: 'right',
      headerClassName: 'w-14',
      render: (c) => (
        <ContactListRowMenu
          name={c.name}
          onEdit={() => setForm({ open: true, contact: c })}
          onDelete={() => setPending({ kind: 'delete', contact: c })}
        />
      ),
    },
  ]

  const showToolbar = loading || filtersApplied || contacts.length > 0
  const confirm = pending ? confirmCopy(pending) : null

  let subtitle = 'The people in your orbit.'
  if (!loading) {
    subtitle = `${plural(contacts.length, 'contact')} ${filtersApplied ? 'match your filters.' : 'in your orbit.'}`
  }

  let body: ReactNode
  if (loading) {
    body = (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  } else if (loadError && contacts.length === 0) {
    body = (
      <EmptyState
        icon={<AlertIcon width={20} height={20} />}
        title="Could not load contacts"
        body={loadError}
        action={
          <Button
            variant="secondary"
            icon={<RefreshIcon width={16} height={16} />}
            loading={refreshing}
            onClick={() => void load()}
          >
            Try again
          </Button>
        }
      />
    )
  } else if (contacts.length === 0 && !filtersApplied) {
    body = (
      <EmptyState
        icon={<UsersIcon width={20} height={20} />}
        title="No contacts yet"
        body="Add the people you want to keep in touch with, or load sample data to look around first."
        action={
          <>
            <Button icon={<PlusIcon width={16} height={16} />} onClick={openCreate}>
              Add contact
            </Button>
            <Button
              variant="secondary"
              icon={<SparklesIcon width={16} height={16} />}
              loading={addingSamples}
              onClick={() => void handleAddSamples()}
            >
              Add sample data
            </Button>
          </>
        }
      />
    )
  } else if (contacts.length === 0) {
    body = (
      <EmptyState
        icon={<SearchIcon width={20} height={20} />}
        title="No contacts match"
        body="Try a different search, or clear the filters to see everyone."
        action={
          <Button variant="secondary" onClick={clearFilters}>
            Clear filters
          </Button>
        }
      />
    )
  } else {
    body = (
      <div aria-busy={refreshing} className={`transition-opacity ${refreshing ? 'opacity-60' : ''}`}>
        <DataTable
          rows={contacts}
          columns={columns}
          rowKey={(c) => String(c.id)}
          selectable
          selectedIds={selected}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          onRowClick={(c) => {
            void navigate(`/contacts/${c.id}`)
          }}
        />
      </div>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Contacts"
        subtitle={subtitle}
        actions={
          <Button icon={<PlusIcon width={16} height={16} />} onClick={openCreate}>
            Add contact
          </Button>
        }
      />

      {hasSamples ? <ContactListSampleNotice onRemove={() => setPending({ kind: 'samples' })} /> : null}

      {showToolbar ? (
        <ContactListToolbar
          query={query}
          onQueryChange={setQuery}
          circle={circle}
          onCircleChange={setCircle}
          status={status}
          onStatusChange={setStatus}
          onClear={clearFilters}
        />
      ) : null}

      {selected.size > 0 ? (
        // Sticks under the phone top bar (h-14 plus the notch inset) so it stays reachable while selecting.
        <div className="sticky top-[calc(3.5rem_+_env(safe-area-inset-top)_+_0.5rem)] z-10 flex flex-wrap items-center gap-2 rounded-card bg-surface px-4 py-2 shadow-md md:top-4">
          <span className="mr-auto text-sm font-medium text-text-primary">{selected.size} selected</span>
          {!allSelected ? (
            <Button variant="ghost" onClick={() => toggleAll(true)}>
              Select all
            </Button>
          ) : null}
          <Button variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
          <Button
            variant="danger"
            icon={<TrashIcon width={16} height={16} />}
            onClick={() => setPending({ kind: 'bulk', ids: [...selected].map(Number) })}
          >
            Delete selected
          </Button>
        </div>
      ) : null}

      {body}

      <ContactFormModal open={form.open} contact={form.contact} onClose={closeForm} onSaved={handleSaved} />

      <ConfirmDialog
        open={pending !== null}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.confirmLabel}
        onConfirm={runPending}
        onClose={closeConfirm}
      />
    </PageContainer>
  )
}
