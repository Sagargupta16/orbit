import type { ReactNode } from 'react'

interface PageSectionProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/** White card on the canvas with an optional header row. */
export function PageSection({ title, description, actions, children, className = '' }: PageSectionProps) {
  return (
    <section className={`rounded-card bg-surface p-4 shadow-sm sm:p-5 ${className}`}>
      {title || actions ? (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {title ? <h2 className="text-sm font-semibold text-text-primary">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-xs text-text-secondary">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
