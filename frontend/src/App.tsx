import { useEffect, useState } from 'react'

type Health = { status: string; version: string }

function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setError(true))
  }, [])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-4xl font-bold tracking-tight">orbit</h1>
      <p className="text-neutral-500">
        Personal CRM -- the people in your orbit, managed.
      </p>
      <p className="text-sm text-neutral-400">
        {health
          ? `API up (v${health.version})`
          : error
            ? 'API not reachable'
            : 'Checking API...'}
      </p>
    </main>
  )
}

export default App
