import type { Circle } from '@/lib/api/types'
import { CIRCLE_META } from './meta'

/** Small pill with the circle's color dot and name. */
export function CircleChip({ circle }: { circle: Circle }) {
  const meta = CIRCLE_META[circle]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-badge px-2 py-0.5 text-xs font-medium ${meta.chip}`}
    >
      <span className={`size-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {circle}
    </span>
  )
}
