import { useEffect, useState } from 'react'
import { fetchProviders, startOAuth } from '@/lib/auth/useAuth'
import type { OAuthProviderConfig } from '@/lib/auth/types'

const PROVIDER_LABEL: Record<string, string> = {
  github: 'Continue with GitHub',
  google: 'Continue with Google',
}

export function AuthModal() {
  const [providers, setProviders] = useState<OAuthProviderConfig[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProviders()
      .then(setProviders)
      .catch(() => setError('Could not reach the server. Is the API running?'))
  }, [])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm rounded-panel bg-surface p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white">
            o
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">orbit</h1>
          <p className="text-sm text-text-secondary">The people in your orbit, managed.</p>
        </div>

        <div className="flex flex-col gap-2">
          {providers.map((p) => (
            <button
              key={p.provider}
              type="button"
              onClick={() => startOAuth(p)}
              className="w-full rounded-control bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              {PROVIDER_LABEL[p.provider] ?? `Continue with ${p.provider}`}
            </button>
          ))}

          {providers.length === 0 && !error ? (
            <p className="text-center text-sm text-text-secondary">
              No sign-in providers configured yet.
            </p>
          ) : null}
          {error ? <p className="text-center text-sm text-badge-error-fg">{error}</p> : null}
        </div>
      </div>
    </div>
  )
}
