import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EditIcon, MoreIcon, TrashIcon } from '@/components/icons'

interface ContactListRowMenuProps {
  /** Contact name, used in the accessible labels. */
  name: string
  onEdit: () => void
  onDelete: () => void
}

interface MenuPosition {
  right: number
  top?: number
  bottom?: number
}

// Two 40px items plus padding and border; used to decide whether the menu opens up or down.
const MENU_HEIGHT = 96
const GAP = 4

const ITEM =
  'flex h-10 w-full items-center gap-3 rounded-control px-3 text-sm font-medium hover:bg-surface-subtle focus:bg-surface-subtle focus:outline-none'

/**
 * The "..." button on a contact row with an Edit / Delete menu. The menu renders in a portal
 * with fixed positioning so the table's overflow does not clip it, and every click stops
 * propagation so the row underneath never opens.
 */
export function ContactListRowMenu({ name, onEdit, onDelete }: ContactListRowMenuProps) {
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const open = position !== null

  function openMenu() {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const viewport = document.documentElement
    const right = Math.max(8, viewport.clientWidth - rect.right)
    const fitsBelow = rect.bottom + GAP + MENU_HEIGHT <= viewport.clientHeight
    setPosition(
      fitsBelow
        ? { right, top: rect.bottom + GAP }
        : { right, bottom: viewport.clientHeight - rect.top + GAP },
    )
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      setPosition(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setPosition(null)
      triggerRef.current?.focus()
    }
    // A fixed menu would drift away from its row, so any scroll or resize closes it.
    const onViewportChange = () => setPosition(null)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onViewportChange, true)
      window.removeEventListener('resize', onViewportChange)
    }
  }, [open])

  function choose(action: () => void) {
    setPosition(null)
    action()
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          if (open) setPosition(null)
          else openMenu()
        }}
        // Rows already hover to surface-subtle, so the trigger uses the hairline tone to stand out.
        className={`inline-flex size-10 items-center justify-center rounded-control transition-colors hover:bg-border-hairline hover:text-text-primary ${
          open ? 'bg-border-hairline text-text-primary' : 'text-text-secondary'
        }`}
      >
        <MoreIcon width={18} height={18} />
      </button>
      {position
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label={`Actions for ${name}`}
              style={position}
              // Portal events still bubble through the React tree, so stop them reaching the row.
              onClick={(e) => e.stopPropagation()}
              className="fixed z-40 w-44 animate-toast-in rounded-card border border-border-hairline bg-surface p-1.5 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => choose(onEdit)}
                className={`${ITEM} text-text-primary`}
              >
                <EditIcon width={16} height={16} />
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => choose(onDelete)}
                className={`${ITEM} text-badge-error-fg`}
              >
                <TrashIcon width={16} height={16} />
                Delete
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
