import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/toast-context'
import { ArrowLeftIcon, UsersIcon } from '@/components/icons'
import { ContactFormModal } from '@/components/contacts/ContactFormModal'
import { InteractionFormModal } from '@/components/interactions/InteractionFormModal'
import { ReminderFormModal } from '@/components/reminders/ReminderFormModal'
import { ContactHeader } from '@/components/contact-detail/ContactHeader'
import { ContactDetailsCard, ContactNotesCard } from '@/components/contact-detail/ContactDetailsCard'
import { InteractionTimeline } from '@/components/contact-detail/InteractionTimeline'
import { ContactReminders } from '@/components/contact-detail/ContactReminders'
import { LoadError } from '@/components/contact-detail/LoadError'
import { useContactDetail } from '@/components/contact-detail/useContactDetail'
import { deleteContact, type Interaction, type Reminder } from '@/lib/api'
import { apiErrorMessage } from '@/lib/api/errors'

function ContactNotFound() {
  return (
    <EmptyState
      icon={<UsersIcon width={20} height={20} />}
      title="Contact not found"
      body="It may have been deleted, or the link is wrong."
      action={
        <Link
          to="/contacts"
          className="inline-flex h-10 items-center justify-center rounded-control bg-brand-600 px-3.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Back to contacts
        </Link>
      }
    />
  )
}

function ContactDetailView({ contactId }: { contactId: number }) {
  const navigate = useNavigate()
  const toast = useToast()
  const {
    contact,
    setContact,
    contactStatus,
    reloadContact,
    interactions,
    interactionsStatus,
    reloadInteractions,
    reminders,
    remindersStatus,
    reloadReminders,
  } = useContactDetail(contactId)

  const [editingContact, setEditingContact] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  // null = closed; { item: null } = create; { item } = edit.
  const [interactionEditor, setInteractionEditor] = useState<{ item: Interaction | null } | null>(null)
  const [reminderEditor, setReminderEditor] = useState<{ item: Reminder | null } | null>(null)

  if (contactStatus === 'loading') {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }
  if (contactStatus === 'notfound') return <ContactNotFound />
  if (!contact) return <LoadError title="Could not load this contact" onRetry={reloadContact} />

  // Logging, editing or deleting an interaction moves last_contacted_at and reconnect_due_on.
  const refreshAfterInteraction = async () => {
    await Promise.all([reloadInteractions(), reloadContact()])
  }

  const handleDelete = async () => {
    try {
      await deleteContact(contact.id)
      toast.success(`Deleted ${contact.name}`)
      navigate('/contacts', { replace: true })
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not delete this contact.'))
    }
  }

  return (
    <>
      <ContactHeader
        contact={contact}
        onLogInteraction={() => setInteractionEditor({ item: null })}
        onAddReminder={() => setReminderEditor({ item: null })}
        onEdit={() => setEditingContact(true)}
        onDelete={() => setConfirmingDelete(true)}
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-5">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <ContactDetailsCard contact={contact} />
          {contact.notes && contact.notes.trim() ? <ContactNotesCard notes={contact.notes} /> : null}
        </div>
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-3">
          <InteractionTimeline
            contactName={contact.name}
            interactions={interactions}
            status={interactionsStatus}
            onRetry={reloadInteractions}
            onLog={() => setInteractionEditor({ item: null })}
            onEdit={(item) => setInteractionEditor({ item })}
            onChanged={refreshAfterInteraction}
          />
          <ContactReminders
            contactName={contact.name}
            reminders={reminders}
            status={remindersStatus}
            onRetry={reloadReminders}
            onAdd={() => setReminderEditor({ item: null })}
            onEdit={(item) => setReminderEditor({ item })}
            onChanged={reloadReminders}
          />
        </div>
      </div>

      <ContactFormModal
        open={editingContact}
        onClose={() => setEditingContact(false)}
        contact={contact}
        onSaved={setContact}
      />
      <InteractionFormModal
        open={interactionEditor !== null}
        onClose={() => setInteractionEditor(null)}
        contactId={contact.id}
        interaction={interactionEditor?.item ?? null}
        onSaved={() => void refreshAfterInteraction()}
      />
      <ReminderFormModal
        open={reminderEditor !== null}
        onClose={() => setReminderEditor(null)}
        contactId={contact.id}
        reminder={reminderEditor?.item ?? null}
        onSaved={() => void reloadReminders()}
      />
      <ConfirmDialog
        open={confirmingDelete}
        title={`Delete ${contact.name}?`}
        message="Their interactions and reminders are deleted too. This cannot be undone."
        confirmLabel="Delete contact"
        onConfirm={handleDelete}
        onClose={() => setConfirmingDelete(false)}
      />
    </>
  )
}

/** /contacts/:id -- everything about one person: details, timeline, reminders. */
export function ContactDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const contactId = /^\d+$/.test(id) ? Number(id) : 0

  return (
    <PageContainer>
      <Link
        to="/contacts"
        className="-my-2 inline-flex min-h-10 items-center gap-1.5 self-start rounded-control text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeftIcon width={16} height={16} />
        Contacts
      </Link>
      {/* Keyed by id so moving between contacts starts from a clean load. */}
      {contactId > 0 ? <ContactDetailView key={contactId} contactId={contactId} /> : <ContactNotFound />}
    </PageContainer>
  )
}
