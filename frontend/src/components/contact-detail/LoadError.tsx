import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { AlertIcon, RefreshIcon } from '@/components/icons'

interface LoadErrorProps {
  title: string
  onRetry: () => Promise<void>
}

/** Empty state for a failed first load, with a retry that shows progress. */
export function LoadError({ title, onRetry }: LoadErrorProps) {
  const [retrying, setRetrying] = useState(false)

  async function handleRetry() {
    setRetrying(true)
    try {
      await onRetry()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <EmptyState
      icon={<AlertIcon width={20} height={20} />}
      title={title}
      body="Check your connection and try again."
      action={
        <Button
          variant="secondary"
          icon={<RefreshIcon width={16} height={16} />}
          loading={retrying}
          onClick={() => void handleRetry()}
        >
          Retry
        </Button>
      }
    />
  )
}
