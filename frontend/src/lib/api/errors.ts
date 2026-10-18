import { isAxiosError } from 'axios'

/** Human-readable message from an API error, using FastAPI's `detail` when present. */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail.length > 0) {
      const first: unknown = detail[0]
      if (first && typeof first === 'object' && 'msg' in first && typeof first.msg === 'string') {
        return first.msg
      }
    }
    if (!error.response) return 'Could not reach the server. Check your connection.'
  }
  return fallback
}
