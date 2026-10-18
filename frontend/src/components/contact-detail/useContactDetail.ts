import { useCallback, useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { useToast } from '@/components/ui/toast-context'
import { apiErrorMessage } from '@/lib/api/errors'
import {
  getContact,
  listInteractions,
  listReminders,
  type Contact,
  type Interaction,
  type Reminder,
} from '@/lib/api'

export type LoadStatus = 'loading' | 'ready' | 'error'

/**
 * Loads one contact plus its interactions and reminders. A failed reload keeps
 * the data already on screen and only reports the error; a 404 on the contact
 * flips `contactStatus` to `notfound`.
 */
export function useContactDetail(contactId: number) {
  const toast = useToast()
  const [contact, setContact] = useState<Contact | null>(null)
  const [contactStatus, setContactStatus] = useState<LoadStatus | 'notfound'>('loading')
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [interactionsStatus, setInteractionsStatus] = useState<LoadStatus>('loading')
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [remindersStatus, setRemindersStatus] = useState<LoadStatus>('loading')

  const reloadContact = useCallback(async () => {
    try {
      setContact(await getContact(contactId))
      setContactStatus('ready')
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        setContactStatus('notfound')
        return
      }
      setContactStatus((s) => (s === 'ready' ? s : 'error'))
      toast.error(apiErrorMessage(error, 'Could not load this contact.'))
    }
  }, [contactId, toast])

  const reloadInteractions = useCallback(async () => {
    try {
      setInteractions(await listInteractions({ contact_id: contactId }))
      setInteractionsStatus('ready')
    } catch (error) {
      setInteractionsStatus((s) => (s === 'ready' ? s : 'error'))
      toast.error(apiErrorMessage(error, 'Could not load interactions.'))
    }
  }, [contactId, toast])

  const reloadReminders = useCallback(async () => {
    try {
      setReminders(await listReminders({ contact_id: contactId, status: 'all' }))
      setRemindersStatus('ready')
    } catch (error) {
      setRemindersStatus((s) => (s === 'ready' ? s : 'error'))
      toast.error(apiErrorMessage(error, 'Could not load reminders.'))
    }
  }, [contactId, toast])

  useEffect(() => {
    void reloadContact()
    void reloadInteractions()
    void reloadReminders()
  }, [reloadContact, reloadInteractions, reloadReminders])

  return {
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
  }
}
