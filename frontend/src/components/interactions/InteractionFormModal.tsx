import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { SelectField, TextArea, TextField } from '@/components/ui/Field'
import { useToast } from '@/components/ui/toast-context'
import { KIND_META } from '@/components/interactions/kinds'
import { apiErrorMessage } from '@/lib/api/errors'
import {
  INTERACTION_KINDS,
  createInteraction,
  listContacts,
  updateInteraction,
  type Contact,
  type Interaction,
  type InteractionKind,
} from '@/lib/api'
import { fromLocalInputValue, toLocalInputValue } from '@/lib/format'

interface InteractionFormModalProps {
  open: boolean
  onClose: () => void
  contactId?: number
  interaction?: Interaction | null
  onSaved: (interaction: Interaction) => void
}

/**
 * Logs a new interaction or edits one. Creating without `contactId` shows a
 * contact picker. The form mounts fresh on every open, so its fields always
 * start from the props.
 */
export function InteractionFormModal(props: InteractionFormModalProps) {
  if (!props.open) return null
  return <InteractionForm key={props.interaction?.id ?? 'new'} {...props} />
}

interface FieldErrors {
  contact?: string
  when?: string
}

function pickerPlaceholder(contacts: Contact[] | null, error: string | null): string {
  if (error) return 'Contacts unavailable'
  if (contacts === null) return 'Loading contacts...'
  return contacts.length === 0 ? 'No contacts yet' : 'Choose a contact'
}

function InteractionForm({ onClose, contactId, interaction, onSaved }: InteractionFormModalProps) {
  const toast = useToast()
  const formId = useId()
  const kindLabelId = useId()
  const needsPicker = !interaction && contactId === undefined

  const [kind, setKind] = useState<InteractionKind>(interaction?.kind ?? 'call')
  const [pickedId, setPickedId] = useState('')
  const [initialWhen] = useState(() => toLocalInputValue(interaction?.occurred_at ?? new Date()))
  const [when, setWhen] = useState(initialWhen)
  const [maxWhen] = useState(() => toLocalInputValue(new Date()))
  const [notes, setNotes] = useState(interaction?.notes ?? '')
  const [contacts, setContacts] = useState<Contact[] | null>(null)
  const [contactsError, setContactsError] = useState<string | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  // A ref keeps the close handler stable while saving flips, so the Modal does
  // not re-run its open effect (which moves focus) on every save.
  const savingRef = useRef(false)
  const handleClose = useCallback(() => {
    if (!savingRef.current) onClose()
  }, [onClose])

  useEffect(() => {
    if (!needsPicker) return
    let cancelled = false
    listContacts()
      .then((list) => {
        if (!cancelled) setContacts([...list].sort((a, b) => a.name.localeCompare(b.name)))
      })
      .catch((err: unknown) => {
        if (!cancelled) setContactsError(apiErrorMessage(err, 'Could not load your contacts.'))
      })
    return () => {
      cancelled = true
    }
  }, [needsPicker])

  function validate(): boolean {
    const next: FieldErrors = {}
    if (needsPicker && !pickedId) next.contact = 'Choose who you talked to.'
    if (!when) next.when = 'Pick when it happened.'
    else if (new Date(when).getTime() > Date.now()) next.when = 'That time is in the future.'
    setErrors(next)
    return !next.contact && !next.when
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (savingRef.current || !validate()) return
    savingRef.current = true
    setSaving(true)
    const cleanNotes = notes.trim() || null
    try {
      const saved = interaction
        ? await updateInteraction(interaction.id, {
            kind,
            // Only send the time when it changed; the input drops seconds.
            occurred_at: when === initialWhen ? undefined : fromLocalInputValue(when),
            notes: cleanNotes,
          })
        : await createInteraction({
            contact_id: contactId ?? Number(pickedId),
            kind,
            occurred_at: fromLocalInputValue(when),
            notes: cleanNotes,
          })
      toast.success(interaction ? 'Interaction updated' : 'Interaction logged')
      savingRef.current = false
      onSaved(saved)
      onClose()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save the interaction.'))
      savingRef.current = false
      setSaving(false)
    }
  }

  const contactOptions = [
    { value: '', label: pickerPlaceholder(contacts, contactsError) },
    ...(contacts ?? []).map((c) => ({
      value: String(c.id),
      label: c.company ? `${c.name} (${c.company})` : c.name,
    })),
  ]

  return (
    <Modal
      open
      onClose={handleClose}
      title={interaction ? 'Edit interaction' : 'Log interaction'}
      description={interaction ? `With ${interaction.contact_name}` : 'Keep a record of a conversation.'}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {interaction ? 'Save changes' : 'Log interaction'}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        {needsPicker ? (
          <div className="flex flex-col gap-1.5">
            <SelectField
              label="Contact"
              options={contactOptions}
              value={pickedId}
              required
              onChange={(e) => {
                setPickedId(e.target.value)
                setErrors((prev) => ({ ...prev, contact: undefined }))
              }}
              error={contactsError ?? errors.contact}
            />
            {contacts?.length === 0 ? (
              <p className="text-xs text-text-secondary">
                Add someone on the{' '}
                <Link to="/contacts" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                  Contacts page
                </Link>{' '}
                first.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <p id={kindLabelId} className="text-sm font-medium text-text-primary">
            Type
          </p>
          <div
            role="group"
            aria-labelledby={kindLabelId}
            className="flex flex-wrap gap-1 rounded-control bg-surface-subtle p-1"
          >
            {INTERACTION_KINDS.map((k) => {
              const { label, icon: Icon } = KIND_META[k]
              const selected = k === kind
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setKind(k)}
                  className={`inline-flex h-10 min-w-[30%] flex-1 items-center justify-center gap-1.5 rounded-control px-2 text-sm font-medium transition-colors sm:min-w-0 ${
                    selected
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                  }`}
                >
                  <Icon width={16} height={16} aria-hidden="true" />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <TextField
          label="When"
          type="datetime-local"
          value={when}
          max={maxWhen}
          required
          onChange={(e) => {
            setWhen(e.target.value)
            setErrors((prev) => ({ ...prev, when: undefined }))
          }}
          error={errors.when}
        />

        <TextArea
          label="Notes"
          rows={4}
          placeholder="What did you talk about?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          hint="Optional"
        />
      </form>
    </Modal>
  )
}
