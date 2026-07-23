import type { ReactNode } from 'react'
import { useAuth } from '@/lib/auth/useAuth'
import { AuthModal } from './AuthModal'
import { Spinner } from '@/components/ui/Spinner'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <Spinner />
      </div>
    )
  }

  if (!isAuthenticated) return <AuthModal />

  return <>{children}</>
}
