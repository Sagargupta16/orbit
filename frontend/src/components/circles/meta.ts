import type { Circle } from '@/lib/api/types'

/**
 * Color per circle, built only from the AA-verified badge and brand tokens.
 * `dot` is a background class for a small color dot or bar fill; `chip` is the
 * background plus text pair for a pill.
 */
export const CIRCLE_META: Record<Circle, { dot: string; chip: string }> = {
  Family: { dot: 'bg-badge-error-fg', chip: 'bg-badge-error-bg text-badge-error-fg' },
  Friends: { dot: 'bg-badge-success-fg', chip: 'bg-badge-success-bg text-badge-success-fg' },
  Work: { dot: 'bg-brand-500', chip: 'bg-badge-active-bg text-badge-active-fg' },
  Network: { dot: 'bg-badge-pending-fg', chip: 'bg-badge-pending-bg text-badge-pending-fg' },
}
