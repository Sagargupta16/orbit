import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { DateField, SelectField, TextArea, TextField } from '@/components/ui/Field'
import { useToast } from '@/components/ui/toast-context'
import { apiErrorMessage } from '@/lib/api/errors'
import {
  createReminder,
  listContacts,
  updateReminder,
  type Contact,
  type Reminder,
  type ReminderInput,
} from '@/lib/api'
import { addDaysISO, parseISODate, toISODate, todayISO } from '@/lib/format'

interface ReminderFormModalProps {
  open: boolean
  onClose: () => void
  contactId?: number
  reminder?: Reminder | null
  onSaved: (reminder: Reminder) => void
}

/**
 * Creates or edits a reminder. Without `contactId` it shows an optional contact
 * picker. The form mounts fresh on every open, so its fields always start from
 * the props (a new reminder is due tomorrow).
 */
export function ReminderFormModal(props: ReminderFormModalProps) {
  if (!props.open) return null
  return <ReminderForm key={props.reminder?.id ?? 'new'} {...props} />
}

interface FieldErrors {
  title?: string
  dueDate?: string
}

/** Same day next month, clamped to that month's last day (Jan 31 -> Feb 28). */
function addMonthISO(value: string): string {
  const d = parseISODate(value)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 2, 0).getDate()
  return toISODate(new Date(d.getFullYear(), d.getMonth() + 1, Math.min(d.getDate(), lastDay)))
}

function quickDates(): { label: string; value: string }[] {
  const today = todayISO()
  return [
    { label: 'Today', value: today },
    { label: 'Tomorrow', value: addDaysISO(today, 1) },
    { label: 'Next week', value: addDaysISO(today, 7) },
    { label: 'Next month', value: addMonthISO(today) },
  ]
}

function ReminderForm({ onClose, contactId, reminder, onSaved }: ReminderFormModalProps) {
  const toast = useToast()
  const formId = useId()
  const chipsLabelId = useId()
  const needsPicker = contactId === undefined

  const [title, setTitle] = useState(reminder?.title ?? '')
  const [dueDate, setDueDate] = useState(() => reminder?.due_date ?? addDaysISO(todayISO(), 1))
  const [pickedId, setPickedId] = useState(
    reminder && reminder.contact_id !== null ? String(reminder.contact_id) : '',
  )
  const [notes, setNotes] = useState(reminder?.notes ?? '')
  const [quick] = useState(quickDates)
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
    if (!title.trim()) next.title = 'Give the reminder a title.'
    if (!dueDate) next.dueDate = 'Pick a due date.'
    setErrors(next)
    return !next.title && !next.dueDate
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (savingRef.current || !validate()) return
    savingRef.current = true
    setSaving(true)
    const pickedContact = pickedId ? Number(pickedId) : null
    const input: ReminderInput = {
      title: title.trim(),
      due_date: dueDate,
      contact_id: needsPicker ? pickedContact : contactId,
      notes: notes.trim() || null,
    }
    try {
      const saved = reminder ? await updateReminder(reminder.id, input) : await createReminder(input)
      toast.success(reminder ? 'Reminder updated' : 'Reminder added')
      savingRef.current = false
      onSaved(saved)
      onClose()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save the reminder.'))
      savingRef.current = false
      setSaving(false)
    }
  }

  const contactOptions = [{ value: '', label: 'No contact' }]
  if (contacts) {
    for (const c of contacts) {
      contactOptions.push({ value: String(c.id), label: c.company ? `${c.name} (${c.company})` : c.name })
    }
  } else if (reminder && reminder.contact_id !== null) {
    // Until the list arrives, keep an edited reminder's current link selected.
    contactOptions.push({ value: String(reminder.contact_id), label: reminder.contact_name ?? 'Linked contact' })
  }
  const loadingContacts = contacts === null && !contactsError

  return (
    <Modal
      open
      onClose={handleClose}
      title={reminder ? 'Edit reminder' : 'Add reminder'}
      description={reminder ? undefined : 'A nudge to follow up on something.'}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {reminder ? 'Save changes' : 'Add reminder'}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        <TextField
          label="Title"
          value={title}
          placeholder="Call Mom about the trip"
          maxLength={255}
          autoComplete="off"
          required
          onChange={(e) => {
            setTitle(e.target.value)
            setErrors((prev) => ({ ...prev, title: undefined }))
          }}
          error={errors.title}
        />

        <div className="flex flex-col gap-2">
          <DateField
            label="Due date"
            value={dueDate}
            required
            onChange={(e) => {
              setDueDate(e.target.value)
              setErrors((prev) => ({ ...prev, dueDate: undefined }))
            }}
            error={errors.dueDate}
          />
          <span id={chipsLabelId} className="sr-only">
            Quick due dates
          </span>
          <div role="group" aria-labelledby={chipsLabelId} className="flex flex-wrap gap-2">
            {quick.map((q) => {
              const selected = q.value === dueDate
              return (
                <button
                  key={q.label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setDueDate(q.value)
                    setErrors((prev) => ({ ...prev, dueDate: undefined }))
                  }}
                  className={`inline-flex h-10 items-center rounded-badge border px-3.5 text-sm font-medium transition active:scale-95 ${
                    selected
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-border-hairline bg-surface text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                  }`}
                >
                  {q.label}
                </button>
              )
            })}
          </div>
        </div>

        {needsPicker ? (
          <SelectField
            label="Contact"
            options={contactOptions}
            value={pickedId}
            disabled={loadingContacts}
            onChange={(e) => setPickedId(e.target.value)}
            error={contactsError ?? undefined}
            hint={loadingContacts ? 'Loading contacts...' : 'Optional'}
          />
        ) : null}

        <TextArea
          label="Notes"
          rows={3}
          placeholder="Anything to remember when the day comes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          hint="Optional"
        />
      </form>
    </Modal>
  )
}
