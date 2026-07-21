import { useMemo, useState } from 'react'
import { PageContainer, PageHeader } from '@/components/layout/PageContainer'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge, Badge } from '@/components/ui/StatusBadge'
import {
  FilterIcon,
  MailIcon,
  MessageIcon,
  MoreIcon,
  PhoneIcon,
  PlusIcon,
  SearchIcon,
} from '@/components/icons'
import { demoContacts, type Channel, type Contact } from '@/data/contacts'

const CHANNEL_ICON: Record<Channel, typeof MailIcon> = {
  email: MailIcon,
  call: PhoneIcon,
  message: MessageIcon,
}

const CHANNEL_LABEL: Record<Channel, string> = {
  email: 'Email',
  call: 'Call',
  message: 'Message',
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[m - 1]} ${d}, ${y}`
}

export function ContactsPage() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return demoContacts
    return demoContacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.circle.toLowerCase().includes(q),
    )
  }, [query])

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(filtered.map((c) => c.id)) : new Set())
  }

  const columns: Column<Contact>[] = [
    {
      key: 'name',
      header: 'Name',
      mobilePrimary: true,
      sortValue: (c) => c.name,
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.name} />
          <div className="min-w-0">
            <p className="truncate font-medium text-text-primary">{c.name}</p>
            <p className="truncate text-xs text-text-secondary">{c.email}</p>
          </div>
        </div>
      ),
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
      render: (c) => <span className="text-text-secondary">{c.circle}</span>,
    },
    {
      key: 'channel',
      header: 'Preferred',
      mobileLabel: 'Preferred',
      render: (c) => {
        const Icon = CHANNEL_ICON[c.channel]
        return (
          <span className="inline-flex items-center gap-1.5 text-text-secondary">
            <Icon width={14} height={14} />
            {CHANNEL_LABEL[c.channel]}
          </span>
        )
      },
    },
    {
      key: 'addedDate',
      header: 'Added',
      mobileLabel: 'Added',
      sortValue: (c) => c.addedDate,
      render: (c) => <span className="text-text-secondary">{formatDate(c.addedDate)}</span>,
    },
    {
      key: 'lastInteraction',
      header: 'Last Interaction',
      mobileLabel: 'Last seen',
      render: (c) => <span className="text-text-secondary">{c.lastInteraction}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: () => (
        <button
          type="button"
          aria-label="Row actions"
          className="inline-flex size-8 items-center justify-center rounded-control text-text-placeholder hover:bg-surface-subtle hover:text-text-primary"
        >
          <MoreIcon />
        </button>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Contacts"
        subtitle="The people in your orbit."
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-control bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            <PlusIcon width={16} height={16} />
            Add contact
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 md:max-w-sm">
          <SearchIcon
            width={16}
            height={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-placeholder"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full rounded-control border border-border-hairline bg-surface py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-placeholder focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-control border border-border-hairline bg-surface px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <FilterIcon width={16} height={16} />
          Filters
        </button>
      </div>

      {selected.size > 0 ? (
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <Badge variant="active">{`${selected.size} selected`}</Badge>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="hover:text-text-primary"
          >
            Clear
          </button>
        </div>
      ) : null}

      <DataTable
        rows={filtered}
        columns={columns}
        rowKey={(c) => c.id}
        selectable
        selectedIds={selected}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        emptyMessage="No contacts match your search."
      />
    </PageContainer>
  )
}
