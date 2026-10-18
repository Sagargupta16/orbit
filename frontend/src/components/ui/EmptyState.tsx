import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  body?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-card bg-surface px-6 py-12 text-center shadow-sm">
      {icon ? (
        <span className="mb-3 inline-flex size-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          {icon}
        </span>
      ) : null}
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      {body ? <p className="mt-1 max-w-sm text-sm text-text-secondary">{body}</p> : null}
      {action ? <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  )
}
