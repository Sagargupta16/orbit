interface AvatarProps {
  name: string
  size?: number
}

// Deterministic tint per name so avatars are stable across renders.
const TINTS = [
  'bg-brand-100 text-brand-700',
  'bg-badge-success-bg text-badge-success-fg',
  'bg-badge-pending-bg text-badge-pending-fg',
  'bg-badge-error-bg text-badge-error-fg',
  'bg-badge-paused-bg text-badge-paused-fg',
]

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : ''
  return (first + last).toUpperCase()
}

function tintFor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash + ch.charCodeAt(0)) % TINTS.length
  return TINTS[hash]
}

export function Avatar({ name, size = 32 }: AvatarProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-xs font-semibold ${tintFor(name)}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
