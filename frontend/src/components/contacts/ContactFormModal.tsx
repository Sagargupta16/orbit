import { useId, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { DateField, NumberField, SelectField, TextArea, TextField } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/toast-context'
import { createContact, updateContact } from '@/lib/api/contacts'
import { apiErrorMessage } from '@/lib/api/errors'
import {
  CHANNELS,
  CIRCLES,
  STATUSES,
  type Channel,
  type Circle,
  type Contact,
  type ContactInput,
  type ContactStatus,
} from '@/lib/api/types'
import { todayISO } from '@/lib/format'

interface ContactFormModalProps {
  open: boolean
  onClose: () => void
  /** Edit this contact; create a new one when null or undefined. */
  contact?: Contact | null
  onSaved: (contact: Contact) => void
}

interface FormValues {
  name: string
  email: string
  phone: string
  company: string
  title: string
  circle: Circle
  status: ContactStatus
  channel: Channel
  birthday: string
  stayInTouchDays: string
  notes: string
}

type FormErrors = Partial<Record<'name' | 'stayInTouchDays', string>>

const STATUS_LABEL: Record<ContactStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  pending: 'Pending',
}

const CHANNEL_LABEL: Record<Channel, string> = {
  email: 'Email',
  call: 'Call',
  message: 'Message',
}

const CIRCLE_OPTIONS = CIRCLES.map((c) => ({ value: c, label: c }))
const STATUS_OPTIONS = STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))
const CHANNEL_OPTIONS = CHANNELS.map((c) => ({ value: c, label: CHANNEL_LABEL[c] }))

const MAX_CADENCE_DAYS = 3650

function toFormValues(contact: Contact | null | undefined): FormValues {
  return {
    name: contact?.name ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    company: contact?.company ?? '',
    title: contact?.title ?? '',
    circle: contact?.circle ?? 'Network',
    status: contact?.status ?? 'active',
    channel: contact?.channel ?? 'email',
    birthday: contact?.birthday ?? '',
    stayInTouchDays: contact?.stay_in_touch_days == null ? '' : String(contact.stay_in_touch_days),
    notes: contact?.notes ?? '',
  }
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  if (values.name.trim() === '') errors.name = 'Name is required.'
  const days = values.stayInTouchDays.trim()
  if (days !== '') {
    const n = Number(days)
    if (!Number.isInteger(n) || n < 1 || n > MAX_CADENCE_DAYS) {
      errors.stayInTouchDays = `Enter a whole number of days from 1 to ${MAX_CADENCE_DAYS}.`
    }
  }
  return errors
}

/** Trimmed text, or null so a cleared field is cleared on the server too. */
function optionalText(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function toInput(values: FormValues): ContactInput {
  const days = values.stayInTouchDays.trim()
  return {
    name: values.name.trim(),
    email: optionalText(values.email),
    phone: optionalText(values.phone),
    company: optionalText(values.company),
    title: optionalText(values.title),
    circle: values.circle,
    status: values.status,
    channel: values.channel,
    birthday: values.birthday === '' ? null : values.birthday,
    notes: optionalText(values.notes),
    stay_in_touch_days: days === '' ? null : Number(days),
  }
}

/** Create or edit a contact. Shows its own success or error toast. */
export function ContactFormModal(props: ContactFormModalProps) {
  if (!props.open) return null
  // Mounting fresh on every open resets the fields from `contact`.
  return <ContactFormDialog key={props.contact?.id ?? 'new'} {...props} />
}

function ContactFormDialog({ onClose, contact, onSaved }: ContactFormModalProps) {
  const toast = useToast()
  const formId = useId()
  const [values, setValues] = useState<FormValues>(() => toFormValues(contact))
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    if (saving) return
    const found = validate(values)
    setErrors(found)
    if (found.name || found.stayInTouchDays) return
    setSaving(true)
    try {
      const input = toInput(values)
      const saved = contact ? await updateContact(contact.id, input) : await createContact(input)
      toast.success(contact ? `Saved ${saved.name}` : `Added ${saved.name}`)
      onSaved(saved)
      onClose()
    } catch (err) {
      toast.error(apiErrorMessage(err, contact ? 'Could not save the contact.' : 'Could not add the contact.'))
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={contact ? 'Edit contact' : 'Add contact'}
      description={contact ? contact.name : 'Only the name is required.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {contact ? 'Save changes' : 'Add contact'}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <TextField
          label="Name"
          value={values.name}
          onChange={(e) => {
            update('name', e.target.value)
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
          }}
          error={errors.name}
          placeholder="Full name"
          maxLength={255}
          autoComplete="off"
        />
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          value={values.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="name@example.com"
          maxLength={255}
          autoComplete="off"
        />
        <TextField
          label="Phone"
          type="tel"
          inputMode="tel"
          value={values.phone}
          onChange={(e) => update('phone', e.target.value)}
          maxLength={50}
          autoComplete="off"
        />
        <TextField
          label="Company"
          value={values.company}
          onChange={(e) => update('company', e.target.value)}
          maxLength={255}
          autoComplete="off"
        />
        <TextField
          label="Title"
          value={values.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="Job title"
          maxLength={255}
          autoComplete="off"
        />
        <SelectField
          label="Circle"
          options={CIRCLE_OPTIONS}
          value={values.circle}
          onChange={(e) => update('circle', e.target.value as Circle)}
        />
        <SelectField
          label="Status"
          options={STATUS_OPTIONS}
          value={values.status}
          onChange={(e) => update('status', e.target.value as ContactStatus)}
        />
        <SelectField
          label="Preferred channel"
          options={CHANNEL_OPTIONS}
          value={values.channel}
          onChange={(e) => update('channel', e.target.value as Channel)}
        />
        <DateField
          label="Birthday"
          value={values.birthday}
          onChange={(e) => update('birthday', e.target.value)}
          max={todayISO()}
        />
        <NumberField
          label="Keep in touch every N days"
          value={values.stayInTouchDays}
          onChange={(e) => {
            update('stayInTouchDays', e.target.value)
            if (errors.stayInTouchDays) setErrors((prev) => ({ ...prev, stayInTouchDays: undefined }))
          }}
          error={errors.stayInTouchDays}
          hint="Leave empty for no reminder cadence"
          placeholder="e.g. 30"
          min={1}
          max={MAX_CADENCE_DAYS}
          step={1}
        />
        <div className="sm:col-span-2">
          <TextArea
            label="Notes"
            value={values.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={4}
            placeholder="How you met, what they care about, anything worth remembering"
          />
        </div>
      </form>
    </Modal>
  )
}
