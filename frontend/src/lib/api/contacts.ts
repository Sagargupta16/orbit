import { api } from '@/lib/auth/client'
import type { Contact, ContactFilters, ContactInput } from './types'

export async function listContacts(filters: ContactFilters = {}): Promise<Contact[]> {
  const params: Record<string, string> = {}
  if (filters.q) params.q = filters.q
  if (filters.circle) params.circle = filters.circle
  if (filters.status) params.status = filters.status
  const { data } = await api.get<Contact[]>('/api/contacts', { params })
  return data
}

export async function getContact(id: number): Promise<Contact> {
  const { data } = await api.get<Contact>(`/api/contacts/${id}`)
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

export async function bulkDeleteContacts(ids: number[]): Promise<number> {
  const { data } = await api.post<{ deleted: number }>('/api/contacts/bulk-delete', { ids })
  return data.deleted
}
