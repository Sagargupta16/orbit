import type { ContactStatus } from '@/data/contacts'

type Variant = 'active' | 'paused' | 'pending' | 'success' | 'error'

const STYLES: Record<Variant, string> = {
  active: 'bg-badge-active-bg text-badge-active-fg',
  paused: 'bg-badge-paused-bg text-badge-paused-fg',
  pending: 'bg-badge-pending-bg text-badge-pending-fg',
  success: 'bg-badge-success-bg text-badge-success-fg',
  error: 'bg-badge-error-bg text-badge-error-fg',
}

const STATUS_LABEL: Record<ContactStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  pending: 'Pending',
}

export function Badge({ variant, children }: { variant: Variant; children: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-badge px-2.5 py-0.5 text-xs font-medium ${STYLES[variant]}`}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: ContactStatus }) {
  return <Badge variant={status}>{STATUS_LABEL[status]}</Badge>
}
