import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CircleCard } from '@/components/circles/CircleCard'
import { ContactFormModal } from '@/components/contacts/ContactFormModal'
import { AlertIcon, CircleIcon, PlusIcon } from '@/components/icons'
import { PageContainer, PageHeader } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/toast-context'
import { listContacts, updateContact } from '@/lib/api/contacts'
import { apiErrorMessage } from '@/lib/api/errors'
import { CIRCLES, type Circle, type Contact } from '@/lib/api/types'
import { todayISO } from '@/lib/format'

export function CirclesPage() {
  const toast = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [movingId, setMovingId] = useState<number | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      setContacts(await listContacts())
      setError(null)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load your circles.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const grouped = useMemo(() => {
    const groups: Record<Circle, Contact[]> = { Family: [], Friends: [], Work: [], Network: [] }
    for (const contact of contacts) groups[contact.circle].push(contact)
    for (const circle of CIRCLES) groups[circle].sort((a, b) => a.name.localeCompare(b.name))
    return groups
  }, [contacts])

  async function moveContact(contact: Contact, circle: Circle) {
    setMovingId(contact.id)
    try {
      const updated = await updateContact(contact.id, { circle })
      setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      toast.success(`Moved ${updated.name} to ${circle}.`)
    } catch (err) {
      toast.error(apiErrorMessage(err, `Could not move ${contact.name}.`))
    } finally {
      setMovingId(null)
    }
  }

  function retry() {
    setError(null)
    setLoading(true)
    void load()
  }

  const today = todayISO()

  let body: ReactNode
  if (loading) {
    body = (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  } else if (error) {
    body = (
      <EmptyState
        icon={<AlertIcon width={20} height={20} />}
        title="Could not load your circles"
        body={error}
        action={<Button onClick={retry}>Try again</Button>}
      />
    )
  } else if (contacts.length === 0) {
    body = (
      <EmptyState
        icon={<CircleIcon width={20} height={20} />}
        title="Your circles are empty"
        body="Add a contact and pick Family, Friends, Work or Network. You can also try orbit with sample data from the dashboard."
        action={
          <Button icon={<PlusIcon width={16} height={16} />} onClick={() => setAddOpen(true)}>
            Add contact
          </Button>
        }
      />
    )
  } else {
    body = (
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        {CIRCLES.map((circle) => (
          <CircleCard
            key={circle}
            circle={circle}
            members={grouped[circle]}
            today={today}
            movingId={movingId}
            onMove={(contact, next) => void moveContact(contact, next)}
          />
        ))}
      </div>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Circles"
        subtitle="Your people grouped by how close they are. Move anyone as a relationship changes."
        actions={
          <Button icon={<PlusIcon width={16} height={16} />} onClick={() => setAddOpen(true)}>
            Add contact
          </Button>
        }
      />
      {body}

      <ContactFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={(contact) => setContacts((prev) => [contact, ...prev.filter((c) => c.id !== contact.id)])}
      />
    </PageContainer>
  )
}
