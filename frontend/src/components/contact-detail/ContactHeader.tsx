import type { ComponentType, SVGProps } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { CIRCLE_META } from '@/components/circles/meta'
import { ActivityIcon, BellIcon, EditIcon, TrashIcon } from '@/components/icons'
import type { Contact } from '@/lib/api'

interface ContactHeaderProps {
  contact: Contact
  onLogInteraction: () => void
  onAddReminder: () => void
  onEdit: () => void
  onDelete: () => void
}

interface Action {
  key: string
  label: string
  shortLabel: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  onClick: () => void
  danger?: boolean
}

/** Identity card at the top of the contact page with its main actions. */
export function ContactHeader({ contact, onLogInteraction, onAddReminder, onEdit, onDelete }: ContactHeaderProps) {
  const role = [contact.title, contact.company].filter(Boolean).join(' at ')
  const circle = CIRCLE_META[contact.circle]

  const actions: Action[] = [
    { key: 'log', label: 'Log interaction', shortLabel: 'Log', icon: ActivityIcon, onClick: onLogInteraction },
    { key: 'remind', label: 'Add reminder', shortLabel: 'Remind', icon: BellIcon, onClick: onAddReminder },
    { key: 'edit', label: 'Edit', shortLabel: 'Edit', icon: EditIcon, onClick: onEdit },
    { key: 'delete', label: 'Delete', shortLabel: 'Delete', icon: TrashIcon, onClick: onDelete, danger: true },
  ]

  return (
    <section className="rounded-card bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {/* Avatar's own initials are text-xs; the child selector outranks it at this size. */}
          <div className="[&>span]:text-xl">
            <Avatar name={contact.name} size={64} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight break-words text-text-primary">{contact.name}</h1>
            {role ? <p className="mt-0.5 text-sm break-words text-text-secondary">{role}</p> : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-badge px-2.5 py-0.5 text-xs font-medium ${circle.chip}`}
              >
                <span className={`size-1.5 rounded-full ${circle.dot}`} aria-hidden="true" />
                {contact.circle}
              </span>
              <StatusBadge status={contact.status} />
              {contact.is_sample ? <Badge variant="paused">Sample</Badge> : null}
            </div>
          </div>
        </div>

        {/* From 640px: regular buttons under the identity block, beside it from 1280px. */}
        <div className="hidden flex-wrap gap-2 sm:flex xl:shrink-0 xl:justify-end">
          {actions.map(({ key, label, icon: Icon, onClick, danger }, index) => (
            <Button
              key={key}
              variant={index === 0 ? 'primary' : 'secondary'}
              icon={<Icon width={16} height={16} className={danger ? 'text-badge-error-fg' : undefined} />}
              onClick={onClick}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Phones: one row of icon-plus-label buttons under the header. */}
      <div className="mt-4 grid grid-cols-4 gap-2 sm:hidden">
        {actions.map(({ key, label, shortLabel, icon: Icon, onClick, danger }) => (
          <button
            key={key}
            type="button"
            onClick={onClick}
            aria-label={label}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-control bg-surface-subtle px-1 py-2 text-xs font-medium transition-colors active:bg-brand-50 ${
              danger ? 'text-badge-error-fg' : 'text-text-primary'
            }`}
          >
            <Icon width={18} height={18} className={danger ? undefined : 'text-brand-600'} />
            {shortLabel}
          </button>
        ))}
      </div>
    </section>
  )
}
