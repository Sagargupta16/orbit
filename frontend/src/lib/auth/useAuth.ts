import { useCallback, useEffect, useState } from 'react'
import { api } from './client'
import { useAuthStore } from './store'
import type { OAuthProviderConfig, Tokens, User } from './types'

export function useAuth() {
  const { accessToken, user, setUser, setTokens, clear } = useAuthStore()
  const [loading, setLoading] = useState(true)

  // On mount (or token change), resolve the current user.
  useEffect(() => {
    let cancelled = false
    if (!accessToken) {
      setLoading(false)
      return
    }
    api
      .get<User>('/api/auth/me')
      .then(({ data }) => {
        if (!cancelled) setUser(data)
      })
      .catch(() => {
        if (!cancelled) clear()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [accessToken, setUser, clear])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      // even if the server call fails, clear locally
    }
    clear()
  }, [clear])

  return { user, isAuthenticated: Boolean(accessToken && user), loading, logout, setTokens }
}

export async function fetchProviders(): Promise<OAuthProviderConfig[]> {
  const { data } = await api.get<OAuthProviderConfig[]>('/api/auth/oauth/providers')
  return data
}

// Build the provider authorize URL and redirect the browser to it.
export function startOAuth(config: OAuthProviderConfig): void {
  const params = new URLSearchParams({
    client_id: config.client_id,
    redirect_uri: config.redirect_uri,
    scope: config.scope,
    state: config.state,
    response_type: 'code',
  })
  // Stash state so the callback page can validate it round-tripped.
  sessionStorage.setItem('orbit-oauth-state', config.state)
  window.location.href = `${config.authorize_url}?${params.toString()}`
}

export async function completeOAuth(provider: string, code: string, state: string): Promise<Tokens> {
  const { data } = await api.post<Tokens>(`/api/auth/oauth/${provider}/callback`, { code, state })
  return data
}
