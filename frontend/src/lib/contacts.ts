import { api } from '@/lib/auth/client'

export type Circle = 'Family' | 'Friends' | 'Work' | 'Network'
export type ContactStatus = 'active' | 'paused' | 'pending'
export type Channel = 'email' | 'call' | 'message'

export interface Contact {
  id: number
  name: string
  email: string | null
  circle: Circle
  status: ContactStatus
  channel: Channel
  last_interaction: string | null
  created_at: string
}

export interface ContactInput {
  name: string
  email?: string | null
  circle?: Circle
  status?: ContactStatus
  channel?: Channel
  last_interaction?: string | null
}

export async function listContacts(): Promise<Contact[]> {
  const { data } = await api.get<Contact[]>('/api/contacts')
  return data
}

export async function createContact(input: ContactInput): Promise<Contact> {
  const { data } = await api.post<Contact>('/api/contacts', input)
  return data
}

export async function updateContact(id: number, input: Partial<ContactInput>): Promise<Contact> {
  const { data } = await api.patch<Contact>(`/api/contacts/${id}`, input)
  return data
}

export async function deleteContact(id: number): Promise<void> {
  await api.delete(`/api/contacts/${id}`)
}
