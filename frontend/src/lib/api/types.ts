// Shapes mirror .scratch/contract.md and the FastAPI schemas. Datetimes are
// ISO 8601 UTC strings ending in Z; dates are YYYY-MM-DD.

export const CIRCLES = ['Family', 'Friends', 'Work', 'Network'] as const
export const STATUSES = ['active', 'paused', 'pending'] as const
export const CHANNELS = ['email', 'call', 'message'] as const
export const INTERACTION_KINDS = ['call', 'email', 'message', 'meeting', 'other'] as const

export type Circle = (typeof CIRCLES)[number]
export type ContactStatus = (typeof STATUSES)[number]
export type Channel = (typeof CHANNELS)[number]
export type InteractionKind = (typeof INTERACTION_KINDS)[number]

export interface Contact {
  id: number
  name: string
  email: string | null
  phone: string | null
  company: string | null
  title: string | null
  circle: Circle
  status: ContactStatus
  channel: Channel
  birthday: string | null
  notes: string | null
  stay_in_touch_days: number | null
  last_contacted_at: string | null
  reconnect_due_on: string | null
  is_sample: boolean
  created_at: string
  updated_at: string
}

export interface ContactInput {
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  title?: string | null
  circle?: Circle
  status?: ContactStatus
  channel?: Channel
  birthday?: string | null
  notes?: string | null
  stay_in_touch_days?: number | null
}

export interface ContactFilters {
  q?: string
  circle?: Circle
  status?: ContactStatus
}

export interface Interaction {
  id: number
  contact_id: number
  contact_name: string
  kind: InteractionKind
  occurred_at: string
  notes: string | null
  created_at: string
}

export interface InteractionInput {
  contact_id: number
  kind: InteractionKind
  occurred_at?: string
  notes?: string | null
}

export interface Reminder {
  id: number
  title: string
  due_date: string
  notes: string | null
  done: boolean
  done_at: string | null
  contact_id: number | null
  contact_name: string | null
  created_at: string
}

export interface ReminderInput {
  title: string
  due_date: string
  contact_id?: number | null
  notes?: string | null
}

export type ReminderStatusFilter = 'open' | 'done' | 'all'

export interface ReconnectItem {
  contact_id: number
  name: string
  circle: Circle
  last_contacted_at: string | null
  due_on: string
  days_overdue: number
}

export interface BirthdayItem {
  contact_id: number
  name: string
  birthday: string
  next_on: string
  days_until: number
}

export interface Dashboard {
  totals: {
    contacts: number
    interactions_30d: number
    open_reminders: number
    overdue_reminders: number
    reconnect_due: number
  }
  circles: { circle: Circle; count: number }[]
  recent_interactions: Interaction[]
  upcoming_reminders: Reminder[]
  reconnect: ReconnectItem[]
  birthdays: BirthdayItem[]
}

export interface SampleCounts {
  contacts: number
  interactions: number
  reminders: number
}
