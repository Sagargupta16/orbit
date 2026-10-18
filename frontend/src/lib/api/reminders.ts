import { api } from '@/lib/auth/client'
import type { Reminder, ReminderInput, ReminderStatusFilter } from './types'

export interface ReminderQuery {
  status?: ReminderStatusFilter
  contact_id?: number
}

export async function listReminders(query: ReminderQuery = {}): Promise<Reminder[]> {
  const params: Record<string, string> = {}
  if (query.status) params.status = query.status
  if (query.contact_id !== undefined) params.contact_id = String(query.contact_id)
  const { data } = await api.get<Reminder[]>('/api/reminders', { params })
  return data
}

export async function createReminder(input: ReminderInput): Promise<Reminder> {
  const { data } = await api.post<Reminder>('/api/reminders', input)
  return data
}

export async function updateReminder(
  id: number,
  input: Partial<ReminderInput> & { done?: boolean },
): Promise<Reminder> {
  const { data } = await api.patch<Reminder>(`/api/reminders/${id}`, input)
  return data
}

export async function deleteReminder(id: number): Promise<void> {
  await api.delete(`/api/reminders/${id}`)
}
