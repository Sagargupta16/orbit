import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ContactFormModal } from '@/components/contacts/ContactFormModal'
import { CircleBarsCard } from '@/components/dashboard/CircleBarsCard'
import { ComingUpCard } from '@/components/dashboard/ComingUpCard'
import { KpiRow } from '@/components/dashboard/KpiRow'
import { ReachOutCard } from '@/components/dashboard/ReachOutCard'
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard'
import { AlertIcon, PlusIcon, SparklesIcon, UsersIcon } from '@/components/icons'
import { InteractionFormModal } from '@/components/interactions/InteractionFormModal'
import { PageContainer, PageHeader } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/toast-context'
import { addSampleData, getDashboard } from '@/lib/api/dashboard'
import { apiErrorMessage } from '@/lib/api/errors'
import type { Dashboard } from '@/lib/api/types'
import { useAuth } from '@/lib/auth/useAuth'
import { formatDate, todayISO } from '@/lib/format'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/** `undefined` means the modal is closed; `null` means log without a preset contact. */
type LogTarget = number | null | undefined

export function DashboardPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logTarget, setLogTarget] = useState<LogTarget>(undefined)
  const [contactOpen, setContactOpen] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const loaded = useRef(false)

  const load = useCallback(async () => {
    try {
      setData(await getDashboard())
      setError(null)
      loaded.current = true
    } catch (err) {
      const message = apiErrorMessage(err, 'Could not load your dashboard.')
      // A failed refresh keeps the last good data on screen and says so.
      if (loaded.current) toast.error(message)
      else setError(message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  function retry() {
    setError(null)
    setLoading(true)
    void load()
  }

  async function handleSampleData() {
    setSeeding(true)
    try {
      const counts = await addSampleData()
      toast.success(
        `Added ${counts.contacts} sample contacts, ${counts.interactions} interactions and ${counts.reminders} reminders.`,
      )
      await load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not add sample data.'))
    } finally {
      setSeeding(false)
    }
  }

  const now = new Date()
  const firstName = user?.full_name?.trim().split(/\s+/)[0]
  const title = firstName ? `${greeting(now.getHours())}, ${firstName}` : greeting(now.getHours())
  const subtitle = `${WEEKDAYS[now.getDay()]}, ${formatDate(todayISO())}`

  let body: ReactNode
  if (loading) {
    body = (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  } else if (!data) {
    body = (
      <EmptyState
        icon={<AlertIcon width={20} height={20} />}
        title="Could not load your dashboard"
        body={error ?? undefined}
        action={<Button onClick={retry}>Try again</Button>}
      />
    )
  } else if (data.totals.contacts === 0) {
    body = (
      <EmptyState
        icon={<UsersIcon width={20} height={20} />}
        title="Start with your people"
        body="Add the people you want to stay close to, or explore orbit with sample contacts, interactions and reminders you can remove any time."
        action={
          <>
            <Button icon={<PlusIcon width={16} height={16} />} onClick={() => setContactOpen(true)}>
              Add contact
            </Button>
            <Button
              variant="secondary"
              icon={<SparklesIcon width={16} height={16} />}
              loading={seeding}
              onClick={() => void handleSampleData()}
            >
              Try with sample data
            </Button>
          </>
        }
      />
    )
  } else {
    // Below 1024px the column wrappers are `display: contents`, so the cards
    // stack in priority order; from 1024px they become two flex columns.
    body = (
      <>
        <KpiRow totals={data.totals} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="contents lg:col-span-3 lg:flex lg:flex-col lg:gap-4">
            <ReachOutCard
              items={data.reconnect}
              totalDue={data.totals.reconnect_due}
              className="order-1"
              onLog={(contactId) => setLogTarget(contactId)}
            />
            <RecentActivityCard
              interactions={data.recent_interactions}
              className="order-3"
              onLog={() => setLogTarget(null)}
            />
          </div>
          <div className="contents lg:col-span-2 lg:flex lg:flex-col lg:gap-4">
            <ComingUpCard reminders={data.upcoming_reminders} birthdays={data.birthdays} className="order-2" />
            <CircleBarsCard circles={data.circles} className="order-4" />
          </div>
        </div>
      </>
    )
  }

  return (
    <PageContainer>
      <PageHeader title={title} subtitle={subtitle} />
      {body}

      <InteractionFormModal
        open={logTarget !== undefined}
        contactId={logTarget ?? undefined}
        onClose={() => setLogTarget(undefined)}
        onSaved={() => void load()}
      />
      <ContactFormModal open={contactOpen} onClose={() => setContactOpen(false)} onSaved={() => void load()} />
    </PageContainer>
  )
}
