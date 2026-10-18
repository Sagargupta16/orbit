import { api } from '@/lib/auth/client'
import { todayISO } from '@/lib/format'
import type { Dashboard, SampleCounts } from './types'

export async function getDashboard(): Promise<Dashboard> {
  const { data } = await api.get<Dashboard>('/api/dashboard', { params: { today: todayISO() } })
  return data
}

export async function addSampleData(): Promise<SampleCounts> {
  const { data } = await api.post<SampleCounts>('/api/samples', null, {
    params: { today: todayISO() },
  })
  return data
}

export async function removeSampleData(): Promise<number> {
  const { data } = await api.delete<{ deleted_contacts: number }>('/api/samples')
  return data.deleted_contacts
}
