import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { CheckIcon, AlertIcon } from '@/components/icons'
import { ToastContext, type ToastApi } from './toast-context'

type Tone = 'success' | 'error'

interface ToastItem {
  id: number
  tone: Tone
  message: string
}

/** Holds the toast stack; top of the screen on phones, bottom right from 640px. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const push = useCallback((tone: Tone, message: string) => {
    const id = nextId.current++
    setItems((prev) => [...prev.slice(-2), { id, tone, message }])
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-3 sm:inset-x-auto sm:top-auto sm:right-4 sm:bottom-4 sm:items-end"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full max-w-sm animate-toast-in items-center gap-2 rounded-card border bg-surface px-4 py-3 text-sm font-medium shadow-lg ${
              t.tone === 'success' ? 'border-badge-success-bg text-text-primary' : 'border-badge-error-bg text-badge-error-fg'
            }`}
          >
            <span
              className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full ${
                t.tone === 'success' ? 'bg-badge-success-bg text-badge-success-fg' : 'bg-badge-error-bg text-badge-error-fg'
              }`}
            >
              {t.tone === 'success' ? <CheckIcon width={14} height={14} /> : <AlertIcon width={14} height={14} />}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
