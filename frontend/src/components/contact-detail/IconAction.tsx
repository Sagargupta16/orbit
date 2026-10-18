import type { ReactNode } from 'react'

interface IconActionProps {
  label: string
  onClick: () => void
  children: ReactNode
  tone?: 'default' | 'danger'
}

/** 40px icon-only button for per-row edit and delete actions. */
export function IconAction({ label, onClick, children, tone = 'default' }: IconActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex size-10 shrink-0 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-subtle ${
        tone === 'danger' ? 'hover:text-badge-error-fg' : 'hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  )
}
