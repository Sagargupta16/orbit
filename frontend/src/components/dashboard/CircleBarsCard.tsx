import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CIRCLE_META } from '@/components/circles/meta'
import { PageSection } from '@/components/ui/PageSection'
import { CIRCLES, type Dashboard } from '@/lib/api/types'
import { ViewAllLink } from './card-parts'

interface CircleBarsCardProps {
  circles: Dashboard['circles']
  className?: string
}

/** How your people split across the four circles, as plain CSS bars. */
export function CircleBarsCard({ circles, className = '' }: CircleBarsCardProps) {
  // Bars grow in from zero once mounted so the split reads as motion.
  const [grown, setGrown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const counts = CIRCLES.map((circle) => ({
    circle,
    count: circles.find((c) => c.circle === circle)?.count ?? 0,
  }))
  const total = counts.reduce((sum, c) => sum + c.count, 0)

  return (
    <PageSection
      title="Circles"
      description="How your people are spread"
      actions={<ViewAllLink to="/circles">Open circles</ViewAllLink>}
      className={className}
    >
      <ul className="-mx-2 flex flex-col">
        {counts.map(({ circle, count }) => {
          const share = total > 0 ? Math.round((count / total) * 100) : 0
          const width = count > 0 ? Math.max(share, 3) : 0
          return (
            <li key={circle}>
              <Link
                to="/circles"
                aria-label={`${circle}: ${count} ${count === 1 ? 'person' : 'people'}, ${share}%`}
                className="block rounded-control px-2 py-2.5 transition-colors hover:bg-surface-subtle"
              >
                <span className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 font-medium text-text-primary">
                    <span className={`size-2.5 rounded-full ${CIRCLE_META[circle].dot}`} aria-hidden="true" />
                    {circle}
                  </span>
                  <span className="text-text-secondary tabular-nums">
                    {count}
                    <span className="ml-1.5 text-xs text-text-placeholder">{share}%</span>
                  </span>
                </span>
                <span className="mt-2 block h-2 overflow-hidden rounded-badge bg-surface-subtle" aria-hidden="true">
                  <span
                    className={`block h-full rounded-badge transition-[width] duration-700 ease-out ${CIRCLE_META[circle].dot}`}
                    style={{ width: `${grown ? width : 0}%` }}
                  />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </PageSection>
  )
}
