import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from '@/lib/config'
import { useAuthStore } from './store'
import type { Tokens } from './types'

export const api = axios.create({ baseURL: API_BASE_URL })

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// --- 401 handling with a single-flight refresh mutex ---
// When a request 401s, the first failure kicks off a token refresh; concurrent
// 401s queue behind the same refresh promise, then replay once with the new token.
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState()
  if (!refreshToken) return null
  try {
    const { data } = await axios.post<Tokens>(`${API_BASE_URL}/api/auth/refresh`, {
      refresh_token: refreshToken,
    })
    setTokens(data)
    return data.access_token
  } catch {
    clear()
    return null
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error)
    }
    // Don't try to refresh the refresh call itself.
    if (original.url?.includes('/api/auth/refresh')) {
      useAuthStore.getState().clear()
      return Promise.reject(error)
    }

    original._retry = true
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null
    })
    const newToken = await refreshPromise
    if (!newToken) return Promise.reject(error)

    original.headers.Authorization = `Bearer ${newToken}`
    return api(original)
  },
)
