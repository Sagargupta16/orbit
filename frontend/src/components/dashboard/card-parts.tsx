import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRightIcon } from '@/components/icons'

/** Compact "see everything" link for a card header. */
export function ViewAllLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex h-10 items-center gap-0.5 rounded-control px-2 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50"
    >
      {children}
      <ChevronRightIcon width={14} height={14} />
    </Link>
  )
}

/** Muted one-liner for an empty list inside a card. */
export function CardHint({ children }: { children: ReactNode }) {
  return <p className="rounded-control bg-surface-subtle px-3 py-4 text-sm text-text-secondary">{children}</p>
}

/** Small uppercase label that splits a card into sub-lists. */
export function CardSubheading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-1 text-xs font-medium tracking-wide text-text-secondary uppercase">{children}</h3>
  )
}

/** Link to a contact's detail page, styled for list rows. */
export function ContactLink({ id, name }: { id: number; name: string }) {
  return (
    <Link
      to={`/contacts/${id}`}
      className="truncate font-medium text-text-primary transition-colors hover:text-brand-600"
    >
      {name}
    </Link>
  )
}
