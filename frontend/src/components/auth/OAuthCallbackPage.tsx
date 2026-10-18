import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { completeOAuth, OAUTH_STATE_KEY } from '@/lib/auth/useAuth'
import { useAuthStore } from '@/lib/auth/store'

export function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const [error, setError] = useState<string | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return // guard StrictMode double-invoke (code is single-use)
    ran.current = true

    const code = params.get('code')
    const state = params.get('state')
    if (!provider || !code || !state) {
      setError('Missing OAuth parameters.')
      return
    }

    // The state must be the one this browser stashed in startOAuth. The
    // backend's HMAC check proves the server issued it, not that this tab
    // started the flow, so a forged callback link would otherwise log the
    // victim into the attacker's account.
    const expected = sessionStorage.getItem(OAUTH_STATE_KEY)
    sessionStorage.removeItem(OAUTH_STATE_KEY)
    if (!expected || expected !== state) {
      setError('Sign-in request did not start here. Please try again.')
      return
    }

    completeOAuth(provider, code, state)
      .then((tokens) => {
        setTokens(tokens)
        navigate('/', { replace: true })
      })
      .catch(() => setError('Sign-in failed. Please try again.'))
  }, [provider, params, setTokens, navigate])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-4">
      <div className="text-center text-sm text-text-secondary">
        {error ? (
          <>
            <p className="mb-3 text-badge-error-fg">{error}</p>
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="rounded-control bg-brand-600 px-4 py-2 font-medium text-white"
            >
              Back to sign in
            </button>
          </>
        ) : (
          'Completing sign-in...'
        )}
      </div>
    </div>
  )
}
