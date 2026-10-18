import { api } from '@/lib/auth/client'
import type { Interaction, InteractionInput } from './types'

export interface InteractionQuery {
  contact_id?: number
  limit?: number
  before?: string
}

export async function listInteractions(query: InteractionQuery = {}): Promise<Interaction[]> {
  const params: Record<string, string> = {}
  if (query.contact_id !== undefined) params.contact_id = String(query.contact_id)
  if (query.limit !== undefined) params.limit = String(query.limit)
  if (query.before) params.before = query.before
  const { data } = await api.get<Interaction[]>('/api/interactions', { params })
  return data
}

export async function createInteraction(input: InteractionInput): Promise<Interaction> {
  const { data } = await api.post<Interaction>('/api/interactions', input)
  return data
}

export async function updateInteraction(
  id: number,
  input: Partial<Omit<InteractionInput, 'contact_id'>>,
): Promise<Interaction> {
  const { data } = await api.patch<Interaction>(`/api/interactions/${id}`, input)
  return data
}

export async function deleteInteraction(id: number): Promise<void> {
  await api.delete(`/api/interactions/${id}`)
}
